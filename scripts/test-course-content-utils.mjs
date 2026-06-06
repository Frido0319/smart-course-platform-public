import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  rewriteSmartCourseHtml,
  sanitizeSmartCourseAssetPath,
  toSmartCourseStorageKey,
} from "../src/lib/course-content-utils.mjs";

const demoCourseHtmlPath = "protected-content/smart-manufacturing/smart_manufacturing_interactive_guide.html";

test("rewrites course image paths to protected API paths", () => {
  const html =
    '<img src="source_pages/example_Ubung_p01.png">' +
    '<img src="source_pages_full/full_Vorlesung_Trennen_p004.png">' +
    '<img data-src="source_pages_cn/full_Vorlesung_Trennen_p004_CN.png">';

  const rewritten = rewriteSmartCourseHtml(html);

  assert.match(rewritten, /src="\/api\/course\/asset\/source_pages\/example_Ubung_p01\.png"/);
  assert.match(rewritten, /src="\/api\/course\/asset\/source_pages_full\/full_Vorlesung_Trennen_p004\.png"/);
  assert.match(rewritten, /data-src="\/api\/course\/asset\/source_pages_cn\/full_Vorlesung_Trennen_p004_CN\.png"/);
});

test("accepts only expected course image asset paths", () => {
  assert.equal(
    sanitizeSmartCourseAssetPath(["source_pages", "example_Ubung_p01.png"]),
    "source_pages/example_Ubung_p01.png",
  );
  assert.equal(
    sanitizeSmartCourseAssetPath(["source_pages_cn", "example_CN.webp"]),
    "source_pages_cn/example_CN.webp",
  );

  assert.throws(() => sanitizeSmartCourseAssetPath(["..", "secret.txt"]), /Invalid asset path/);
  assert.throws(() => sanitizeSmartCourseAssetPath(["source_pages", "note.html"]), /Invalid asset type/);
  assert.throws(() => sanitizeSmartCourseAssetPath(["other", "page.png"]), /Invalid asset directory/);
});

test("maps asset names to Supabase-safe storage keys", () => {
  assert.equal(
    toSmartCourseStorageKey("source_pages/example_Ubung_p01.png"),
    "source_pages/example_Ubung_p01.png",
  );
});

test("public repository ships a demo course shell, not private paid content", () => {
  const html = fs.readFileSync(demoCourseHtmlPath, "utf8");

  assert.match(html, /Smart Manufacturing Foundations/);
  assert.match(html, /public repository includes a compact demonstration course shell/);
  assert.match(html, /Asset Protection/);
  assert.doesNotMatch(html, /true_exam_question_groups|ubung_question_groups|full_pdf_deep_reading/);
  assert.doesNotMatch(html, /source_text|full_pdf_deep_reading/);
});
