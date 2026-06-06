export function getOrCreateDeviceId(): string {
  const key = "scp_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(key, value);
  return value;
}
