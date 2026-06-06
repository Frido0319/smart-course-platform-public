export type ActivationRecord = {
  id: string;
  code_hash: string;
  course_id: string;
  status: "unused" | "active" | "disabled" | "expired";
  bound_device_id: string | null;
  expires_at: string | null;
};

export function activationCodeLabel(code: string, label?: string): string;

export function displayActivationCode(label: string): {
  code: string;
  note: string;
};

export function ensureDeviceCanUseActivation(
  target: ActivationRecord,
  deviceActiveCodes: ActivationRecord[],
):
  | {
      ok: true;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

export function resetActivationDevicePayload(currentStatus: ActivationRecord["status"]): {
  bound_device_id: null;
  activated_at: null;
  status: ActivationRecord["status"];
};
