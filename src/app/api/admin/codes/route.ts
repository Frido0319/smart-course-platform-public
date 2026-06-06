import { generateActivationCode, hashActivationCode } from "@/lib/crypto";
import { jsonError } from "@/lib/request";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { activationCodeLabel } from "@/lib/activation-policy.mjs";

function isAdmin(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");
  return Boolean(expected && provided && provided === expected);
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return jsonError("Invalid admin password.", 401);

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("activation_codes")
    .select("id,label,course_id,status,bound_device_id,activated_at,expires_at,reset_count,max_resets,last_seen_at,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return jsonError(error.message, 500);
  return Response.json({ ok: true, codes: data || [] });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return jsonError("Invalid admin password.", 401);

  const body = (await request.json().catch(() => ({}))) as {
    count?: number;
    label?: string;
    courseId?: string;
    expiresAt?: string | null;
    maxResets?: number;
  };
  const count = Math.min(Math.max(Number(body.count || 1), 1), 100);
  const courseId = body.courseId || "smart-manufacturing";
  const label = body.label || "";
  const maxResets = Number.isFinite(body.maxResets) ? Number(body.maxResets) : 1;
  const generated = Array.from({ length: count }, () => generateActivationCode());

  const supabase = supabaseAdmin();
  const rows = generated.map((code) => ({
    code_hash: hashActivationCode(code),
    label: activationCodeLabel(code, label),
    course_id: courseId,
    status: "unused",
    expires_at: body.expiresAt || null,
    max_resets: maxResets,
  }));

  const { error } = await supabase.from("activation_codes").insert(rows);
  if (error) return jsonError(error.message, 500);

  return Response.json({ ok: true, codes: generated });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return jsonError("Invalid admin password.", 401);

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return jsonError("Missing activation code id.");

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("activation_codes").delete().eq("id", body.id);
  if (error) return jsonError(error.message, 500);

  return Response.json({ ok: true });
}
