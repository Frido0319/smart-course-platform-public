import { smartManufacturingManifest } from "@/lib/course-data";
import { jsonError } from "@/lib/request";
import { readSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const session = await readSession();
  if (!session) return jsonError("Not signed in.", 401);

  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId") || session.courseId;
  if (courseId !== session.courseId) return jsonError("This session cannot access the requested course.", 403);

  const supabase = supabaseAdmin();
  const { data: activation, error } = await supabase
    .from("activation_codes")
    .select("status,bound_device_id")
    .eq("id", session.activationCodeId)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!activation || activation.status !== "active" || activation.bound_device_id !== session.deviceId) {
    return jsonError("Authorization check failed.", 403);
  }

  if (courseId !== "smart-manufacturing") return jsonError("Course not found.", 404);

  return Response.json({ ok: true, manifest: smartManufacturingManifest });
}
