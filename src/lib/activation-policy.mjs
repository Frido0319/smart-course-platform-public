export function activationCodeLabel(code, label = "") {
  const normalizedCode = code.trim().toUpperCase();
  const note = label.trim();
  return note ? `${normalizedCode} | ${note}` : normalizedCode;
}

export function displayActivationCode(label) {
  const trimmed = label.trim();
  const match = trimmed.match(/^([A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})(?:\s*\|\s*(.*))?$/);
  return {
    code: match?.[1] || "",
    note: match?.[2] || trimmed,
  };
}

export function ensureDeviceCanUseActivation(target, deviceActiveCodes) {
  const conflictingActiveCode = deviceActiveCodes.find(
    (code) => code.id !== target.id && code.status === "active" && code.bound_device_id === target.bound_device_id,
  );

  if (conflictingActiveCode) {
    return {
      ok: false,
      status: 403,
      message: "This device is already bound to another active activation code. Reset or delete the old binding first.",
    };
  }

  return { ok: true };
}

export function resetActivationDevicePayload(currentStatus) {
  return {
    bound_device_id: null,
    activated_at: null,
    status: currentStatus === "disabled" || currentStatus === "expired" ? currentStatus : "unused",
  };
}
