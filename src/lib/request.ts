export function requestMeta(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return {
    ip: forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "",
    userAgent: request.headers.get("user-agent") || "",
  };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, message }, { status });
}
