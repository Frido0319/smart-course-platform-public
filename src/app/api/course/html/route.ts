import { readSmartManufacturingHtml } from "@/lib/course-content";
import { verifyCourseAccess } from "@/lib/course-auth";

export async function GET(request: Request) {
  const auth = await verifyCourseAccess(request, "smart-manufacturing");
  if (!auth.ok) return new Response(auth.message, { status: auth.status });

  const html = await readSmartManufacturingHtml();
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
