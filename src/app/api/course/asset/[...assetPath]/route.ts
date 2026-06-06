import { readFile } from "node:fs/promises";

import { getSmartManufacturingAssetKey, getSmartManufacturingAssetLocalPath } from "@/lib/course-content";
import { verifyCourseAccess } from "@/lib/course-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const contentTypes: Record<string, string> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export async function GET(request: Request, context: { params: Promise<{ assetPath: string[] }> }) {
  const auth = await verifyCourseAccess(request, "smart-manufacturing");
  if (!auth.ok) return new Response(auth.message, { status: auth.status });

  const { assetPath } = await context.params;
  let assetKey: string;
  let localPath: string;
  try {
    assetKey = getSmartManufacturingAssetKey(assetPath);
    localPath = getSmartManufacturingAssetLocalPath(assetPath);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Invalid asset path", { status: 400 });
  }

  const extension = assetKey.split(".").pop()?.toLowerCase() || "";

  if (process.env.NODE_ENV !== "production") {
    try {
      const localBuffer = await readFile(localPath);
      return new Response(localBuffer, {
        headers: {
          "Content-Type": contentTypes[extension] || "application/octet-stream",
          "Cache-Control": "private, no-store",
          "X-Asset-Fallback": "local-dev",
          "X-Robots-Tag": "noindex",
        },
      });
    } catch {
      // Fall through to Supabase so local development can still inspect deployed assets.
    }
  }

  const { data, error } = await supabaseAdmin().storage.from("smart-course-assets").download(assetKey);
  if (data && !error) {
    return new Response(await data.arrayBuffer(), {
      headers: {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  return new Response(`Asset not found: ${assetKey}`, {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
