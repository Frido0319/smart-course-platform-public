const allowedAssetDirectories = new Set(["source_pages", "source_pages_full", "source_pages_cn"]);
const allowedAssetExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function hasUnsafeSegment(value) {
  return value.includes("\\") || value.split("/").some((segment) => !segment || segment === "." || segment === "..");
}

function extensionOf(value) {
  const dot = value.lastIndexOf(".");
  return dot >= 0 ? value.slice(dot).toLowerCase() : "";
}

export function sanitizeSmartCourseAssetPath(parts) {
  if (!Array.isArray(parts) || parts.length < 2) throw new Error("Invalid asset path");

  const normalized = parts.map((part) => decodeURIComponent(String(part))).join("/");
  if (hasUnsafeSegment(normalized)) throw new Error("Invalid asset path");

  const [directory] = normalized.split("/");
  if (!allowedAssetDirectories.has(directory)) throw new Error("Invalid asset directory");
  if (!allowedAssetExtensions.has(extensionOf(normalized))) throw new Error("Invalid asset type");

  return normalized;
}

export function toSmartCourseStorageKey(assetPath) {
  return assetPath
    .split("/")
    .map((segment) =>
      Array.from(segment)
        .map((character) => {
          if (/^[A-Za-z0-9._-]$/.test(character)) return character;
          const codePoint = character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
          return `_u${codePoint}_`;
        })
        .join(""),
    )
    .join("/");
}

export function rewriteSmartCourseHtml(html) {
  const rewritten = html.replace(
    /\b(data-src|src|href)=["']((?:source_pages|source_pages_full|source_pages_cn)\/[^"']+)["']/g,
    (_match, attribute, assetPath) => `${attribute}="/api/course/asset/${assetPath}"`,
  );

  return rewritten.replace(/<img\b(?![^>]*\bdecoding=)([^>]*)>/g, "<img decoding=\"async\"$1>");
}
