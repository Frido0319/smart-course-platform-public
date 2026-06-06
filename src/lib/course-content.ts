import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { rewriteSmartCourseHtml, sanitizeSmartCourseAssetPath, toSmartCourseStorageKey } from "./course-content-utils.mjs";

const smartCourseRoot = path.join(process.cwd(), "protected-content", "smart-manufacturing");
const smartCourseHtmlPath = path.join(smartCourseRoot, "smart_manufacturing_interactive_guide.html");

export async function readSmartManufacturingHtml() {
  const raw = await readFile(smartCourseHtmlPath, "utf8");
  return rewriteSmartCourseHtml(raw);
}

export function getSmartManufacturingAssetKey(parts: string[]) {
  return toSmartCourseStorageKey(sanitizeSmartCourseAssetPath(parts));
}

export function getSmartManufacturingAssetLocalPath(parts: string[]) {
  const assetPath = sanitizeSmartCourseAssetPath(parts);
  return path.join(smartCourseRoot, ...assetPath.split("/"));
}
