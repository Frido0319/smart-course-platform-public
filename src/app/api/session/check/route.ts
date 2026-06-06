import { jsonError, requestMeta } from "@/lib/request";
import { readSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return jsonError("Not signed in or session expired.", 401);

  const body = (await request.json().catch(() => ({}))) as { deviceId?: string };
  if (!body.deviceId || body.deviceId !== session.deviceId) {
    return jsonError("Current browser device does not match the signed-in session.", 403);
  }

  const supabase = supabaseAdmin();
  const { data: activation, error } = await supabase
    .from("activation_codes")
    .select("id,status,bound_device_id,course_id,expires_at")
    .eq("id", session.activationCodeId)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!activation || activation.status !== "active") return jsonError("Activation code is not active.", 403);
  if (activation.bound_device_id !== session.deviceId) return jsonError("Device binding changed. Activate again.", 403);
  if (activation.expires_at && new Date(activation.expires_at).getTime() < Date.now()) {
    return jsonError("Course authorization has expired.", 403);
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
    action: "session_check",
  });

  return Response.json({ ok: true, courseId: session.courseId });
}
