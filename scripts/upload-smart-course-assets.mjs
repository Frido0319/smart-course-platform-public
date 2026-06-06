import { createClient } from "@supabase/supabase-js";
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { toSmartCourseStorageKey } from "../src/lib/course-content-utils.mjs";

const bucketName = "smart-course-assets";
const sourceRoot = process.argv[2] || path.join(process.cwd(), "protected-content", "smart-manufacturing");
const mediaDirs = ["source_pages", "source_pages_full", "source_pages_cn"];
const contentTypes = new Map([
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
    const [name, ...rest] = line.split("=");
    process.env[name] ||= rest.join("=");
  }
}

function listFiles(root, dir, output = []) {
  const current = path.join(root, dir);
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const relative = path.posix.join(dir.replaceAll("\\", "/"), entry.name);
    const fullPath = path.join(root, relative);
    if (entry.isDirectory()) {
      listFiles(root, relative, output);
    } else if (entry.isFile() && contentTypes.has(path.extname(entry.name).toLowerCase())) {
      output.push({ fullPath, key: relative, size: statSync(fullPath).size });
    }
  }
  return output;
}

async function ensureBucket(supabase) {
  const { data } = await supabase.storage.getBucket(bucketName);
  if (data) return;

  const { error } = await supabase.storage.createBucket(bucketName, {
    public: false,
    allowedMimeTypes: ["image/*"],
    fileSizeLimit: "10MB",
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadOne(supabase, file) {
  const contentType = contentTypes.get(path.extname(file.key).toLowerCase()) || "application/octet-stream";
  const storageKey = toSmartCourseStorageKey(file.key);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const { error } = await supabase.storage.from(bucketName).upload(storageKey, createReadStream(file.fullPath), {
      contentType,
      upsert: true,
    });
    if (!error) return;
    if (attempt === 5) throw new Error(`${file.key}: ${error.message}`);
    await wait(1000 * attempt);
  }
}

async function main() {
  loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  for (const dir of mediaDirs) {
    const fullDir = path.join(sourceRoot, dir);
    if (!existsSync(fullDir)) throw new Error(`Missing media directory: ${fullDir}`);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await ensureBucket(supabase);

  const files = mediaDirs.flatMap((dir) => listFiles(sourceRoot, dir));
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  console.log(`Uploading ${files.length} files (${Math.round(totalBytes / 1024 / 1024)} MB) to ${bucketName}`);

  let uploaded = 0;
  const concurrency = Number(process.env.UPLOAD_CONCURRENCY || 3);
  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    for (let index = workerIndex; index < files.length; index += concurrency) {
      await uploadOne(supabase, files[index]);
      uploaded += 1;
      if (uploaded % 25 === 0 || uploaded === files.length) {
        console.log(`Uploaded ${uploaded}/${files.length}`);
      }
    }
  });
  await Promise.all(workers);
  console.log("Upload complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
