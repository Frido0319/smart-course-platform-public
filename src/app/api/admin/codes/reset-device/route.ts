import { jsonError } from "@/lib/request";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resetActivationDevicePayload } from "@/lib/activation-policy.mjs";

export async function POST(request: Request) {
  if (request.headers.get("x-admin-password") !== process.env.ADMIN_PASSWORD) {
    return jsonError("Invalid admin password.", 401);
  }

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return jsonError("Missing activation code id.");

  const supabase = supabaseAdmin();
  const { data: code, error: fetchError } = await supabase
    .from("activation_codes")
    .select("id,status,reset_count,max_resets")
    .eq("id", body.id)
    .maybeSingle();
  if (fetchError) return jsonError(fetchError.message, 500);
  if (!code) return jsonError("Activation code was not found.", 404);

  const { error } = await supabase
    .from("activation_codes")
    .update({
      ...resetActivationDevicePayload(code.status),
      reset_count: Number(code.reset_count || 0) + 1,
    })
    .eq("id", body.id);
  if (error) return jsonError(error.message, 500);

  return Response.json({ ok: true });
}
