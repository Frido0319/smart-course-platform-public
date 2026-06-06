import { jsonError } from "@/lib/request";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (request.headers.get("x-admin-password") !== process.env.ADMIN_PASSWORD) {
    return jsonError("Invalid admin password.", 401);
  }

  const body = (await request.json().catch(() => ({}))) as { id?: string; disabled?: boolean };
  if (!body.id) return jsonError("Missing activation code id.");

  const supabase = supabaseAdmin();
  const nextStatus = body.disabled === false ? "unused" : "disabled";
  const { error } = await supabase.from("activation_codes").update({ status: nextStatus }).eq("id", body.id);
  if (error) return jsonError(error.message, 500);

  return Response.json({ ok: true, status: nextStatus });
}
