import assert from "node:assert/strict";
import test from "node:test";

import {
  activationCodeLabel,
  displayActivationCode,
  ensureDeviceCanUseActivation,
  resetActivationDevicePayload,
} from "../src/lib/activation-policy.mjs";

test("stores generated activation code in label while preserving optional note", () => {
  assert.equal(activationCodeLabel("abcd-2345-efgh", "  May cohort  "), "ABCD-2345-EFGH | May cohort");
  assert.deepEqual(displayActivationCode("ABCD-2345-EFGH | May cohort"), {
    code: "ABCD-2345-EFGH",
    note: "May cohort",
  });
});

test("rejects binding a second active code to the same device", () => {
  const target = {
    id: "new-code",
    code_hash: "new",
    course_id: "smart-manufacturing",
    status: "unused",
    bound_device_id: "device-1",
    expires_at: null,
  };
  const existing = [
    {
      id: "old-code",
      code_hash: "old",
      course_id: "smart-manufacturing",
      status: "active",
      bound_device_id: "device-1",
      expires_at: null,
    },
  ];

  const result = ensureDeviceCanUseActivation(target, existing);

  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
});

test("resetting a disabled code keeps it disabled", () => {
  assert.deepEqual(resetActivationDevicePayload("disabled"), {
    bound_device_id: null,
    activated_at: null,
    status: "disabled",
  });
  assert.deepEqual(resetActivationDevicePayload("active"), {
    bound_device_id: null,
    activated_at: null,
    status: "unused",
  });
});
