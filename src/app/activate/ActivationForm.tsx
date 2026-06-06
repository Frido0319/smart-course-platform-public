"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getOrCreateDeviceId } from "@/lib/device";

type ActivationResponse = {
  message?: string;
  redirectTo?: string;
};

function activationMessage(status: number, message?: string) {
  const text = message?.trim();
  if (text) return text;
  if (status === 404) return "Activation code was not found.";
  if (status === 403) return "Activation code is unavailable, expired, disabled, or bound to another device.";
  if (status >= 500) return "Server could not complete activation. Try again later.";
  return "Activation failed. Check the code and try again.";
}

export function ActivationForm() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDeviceId(getOrCreateDeviceId());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    let response: Response;
    let data: ActivationResponse = {};
    try {
      response = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), deviceId }),
      });
      data = (await response.json().catch(() => ({}))) as ActivationResponse;
    } catch {
      setPending(false);
      setMessage("Network error. Confirm the app server is reachable and try again.");
      return;
    }
    setPending(false);

    if (!response.ok) {
      setMessage(activationMessage(response.status, data.message));
      return;
    }

    router.push(data.redirectTo || "/course/smart-manufacturing");
  }

  return (
    <form className="panel form-panel" onSubmit={submit}>
      <label>
        Activation code
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="ABCD-1234-EFGH"
          autoComplete="one-time-code"
        />
      </label>
      <p className="hint">Current device ID: {deviceId ? `${deviceId.slice(0, 18)}...` : "generating"}</p>
      {message ? (
        <div className="status-message error-message" role="alert">
          <p>{message}</p>
          <div className="auth-actions">
            <button className="button secondary small" onClick={() => setMessage("")} type="button">
              Try again
            </button>
            <Link className="button secondary small" href="/">
              Back home
            </Link>
          </div>
        </div>
      ) : null}
      <button className="button primary" disabled={pending || !deviceId || !code.trim()} type="submit">
        {pending ? "Checking" : "Activate course"}
      </button>
    </form>
  );
}
