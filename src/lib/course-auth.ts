import "server-only";

import { requestMeta } from "@/lib/request";
import { readSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type CourseAuthResult =
  | { ok: true; courseId: string }
  | { ok: false; status: number; message: string };

export async function verifyCourseAccess(request: Request, courseId = "smart-manufacturing"): Promise<CourseAuthResult> {
  const session = await readSession();
  if (!session) return { ok: false, status: 401, message: "Not signed in or session expired." };
  if (session.courseId !== courseId) return { ok: false, status: 403, message: "This session cannot access the requested course." };

  const supabase = supabaseAdmin();
  const { data: activation, error } = await supabase
    .from("activation_codes")
    .select("id,status,bound_device_id,course_id,expires_at")
    .eq("id", session.activationCodeId)
    .maybeSingle();

  if (error) return { ok: false, status: 500, message: error.message };
  if (!activation || activation.status !== "active") {
    return { ok: false, status: 403, message: "Activation code is not active." };
  }
  if (activation.course_id !== courseId || activation.bound_device_id !== session.deviceId) {
    return { ok: false, status: 403, message: "Device binding check failed." };
  }
  if (activation.expires_at && new Date(activation.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 403, message: "Course authorization has expired." };
  }

  const meta = requestMeta(request);
  await supabase
    .from("activation_codes")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", session.activationCodeId);
  await supabase.from("access_logs").insert({
    activation_code_id: session.activationCodeId,
    course_id: session.courseId,
    device_id: session.deviceId,
    ip: meta.ip,
    user_agent: meta.userAgent,
    action: "course_resource",
    detail: { courseId },
  });

  return { ok: true, courseId };
}
