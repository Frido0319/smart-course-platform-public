import { hashActivationCode } from "@/lib/crypto";
import { requestMeta, jsonError } from "@/lib/request";
import { createSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureDeviceCanUseActivation } from "@/lib/activation-policy.mjs";

type ActivateBody = {
  code?: string;
  deviceId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ActivateBody;
  const code = body.code?.trim();
  const deviceId = body.deviceId?.trim();

  if (!code || !deviceId) {
    return jsonError("Enter an activation code and make sure browser storage is available.");
  }

  const supabase = supabaseAdmin();
  const codeHash = hashActivationCode(code);
  const { data: activation, error } = await supabase
    .from("activation_codes")
    .select("*")
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!activation) return jsonError("Activation code was not found.", 404);
  if (activation.status === "disabled") return jsonError("This activation code is disabled.", 403);
  if (activation.expires_at && new Date(activation.expires_at).getTime() < Date.now()) {
    await supabase.from("activation_codes").update({ status: "expired" }).eq("id", activation.id);
    return jsonError("This activation code has expired.", 403);
  }

  if (activation.bound_device_id && activation.bound_device_id !== deviceId) {
    const meta = requestMeta(request);
    await supabase.from("access_logs").insert({
      activation_code_id: activation.id,
      course_id: activation.course_id,
      device_id: deviceId,
      ip: meta.ip,
      user_agent: meta.userAgent,
      action: "device_mismatch",
      detail: { reason: "activation_bound_to_another_device" },
    });
    return jsonError("Device mismatch. This activation code is already bound to another device.", 403);
  }

  const { data: sameDeviceCodes, error: sameDeviceError } = await supabase
    .from("activation_codes")
    .select("id,code_hash,course_id,status,bound_device_id,expires_at")
    .eq("bound_device_id", deviceId)
    .eq("status", "active");
  if (sameDeviceError) return jsonError(sameDeviceError.message, 500);

  const devicePolicy = ensureDeviceCanUseActivation(
    { ...activation, bound_device_id: activation.bound_device_id || deviceId },
    sameDeviceCodes || [],
  );
  if (!devicePolicy.ok) {
    const meta = requestMeta(request);
    await supabase.from("access_logs").insert({
      activation_code_id: activation.id,
      course_id: activation.course_id,
      device_id: deviceId,
      ip: meta.ip,
      user_agent: meta.userAgent,
      action: "device_code_conflict",
      detail: { reason: "device_already_has_active_code" },
    });
    return jsonError(devicePolicy.message || "This device already has another active activation code.", devicePolicy.status || 403);
  }

  const now = new Date().toISOString();
  const updatePayload = activation.bound_device_id
    ? { status: "active", last_seen_at: now }
    : { status: "active", bound_device_id: deviceId, activated_at: now, last_seen_at: now };

  const { error: updateError } = await supabase
    .from("activation_codes")
    .update(updatePayload)
    .eq("id", activation.id);
  if (updateError) return jsonError(updateError.message, 500);

  await createSession({
    activationCodeId: activation.id,
    courseId: activation.course_id,
    deviceId,
    role: "student",
  });

  const meta = requestMeta(request);
  await supabase.from("access_logs").insert({
    activation_code_id: activation.id,
    course_id: activation.course_id,
    device_id: deviceId,
    ip: meta.ip,
    user_agent: meta.userAgent,
    action: activation.bound_device_id ? "login" : "activate",
  });

  return Response.json({
    ok: true,
    courseId: activation.course_id,
    redirectTo: `/course/${activation.course_id}`,
  });
}
