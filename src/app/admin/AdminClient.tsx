"use client";

import { FormEvent, useState } from "react";

import type { ActivationCodeRow } from "@/lib/types";
import { displayActivationCode } from "@/lib/activation-policy.mjs";

function statusText(status: ActivationCodeRow["status"]) {
  const labels: Record<ActivationCodeRow["status"], string> = {
    active: "Active",
    disabled: "Disabled",
    expired: "Expired",
    unused: "Unused",
  };
  return labels[status] || status;
}

export function AdminClient() {
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<ActivationCodeRow[]>([]);
  const [generated, setGenerated] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState("");

  async function adminFetch(path: string, init: RequestInit = {}) {
    return fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
        ...(init.headers || {}),
      },
    });
  }

  async function fetchCodes(clearMessage = true) {
    if (clearMessage) setMessage("");
    const response = await adminFetch("/api/admin/codes");
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to load activation codes.");
      return;
    }
    setCodes(data.codes || []);
    setMessage(`Loaded ${data.codes?.length || 0} activation codes.`);
  }

  async function createCodes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await adminFetch("/api/admin/codes", {
      method: "POST",
      body: JSON.stringify({ count, label, courseId: "smart-manufacturing", maxResets: 1 }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to generate activation codes.");
      return;
    }
    setGenerated(data.codes || []);
    setLabel("");
    setMessage(`Generated ${data.codes?.length || 0} activation codes.`);
    await fetchCodes(false);
  }

  async function resetDevice(id: string) {
    const response = await adminFetch("/api/admin/codes/reset-device", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.message || "Failed to reset device binding.");
      return;
    }
    await fetchCodes(false);
    setMessage("Device binding reset. Disabled or expired codes are not re-enabled.");
  }

  async function disableCode(id: string) {
    const response = await adminFetch("/api/admin/codes/disable", {
      method: "POST",
      body: JSON.stringify({ id, disabled: true }),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.message || "Failed to disable activation code.");
      return;
    }
    await fetchCodes(false);
    setMessage("Activation code disabled.");
  }

  async function deleteCode(id: string) {
    const ok = window.confirm("Delete this activation code? The code will no longer be usable.");
    if (!ok) return;
    const response = await adminFetch("/api/admin/codes", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.message || "Failed to delete activation code.");
      return;
    }
    await fetchCodes(false);
    setMessage("Activation code deleted.");
  }

  return (
    <div className="admin-stack">
      <section className="panel form-panel">
        <label>
          Admin password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="ADMIN_PASSWORD"
          />
        </label>
        <button className="button secondary" disabled={!password} onClick={() => void fetchCodes()} type="button">
          Load activation codes
        </button>
        {message ? <p className="error">{message}</p> : null}
      </section>

      <form className="panel form-inline" onSubmit={createCodes}>
        <label>
          Count
          <input
            min={1}
            max={100}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            type="number"
          />
        </label>
        <label className="grow-field">
          Note
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="student name, order id, cohort, or internal note"
          />
        </label>
        <button className="button primary" disabled={!password} type="submit">
          Generate codes
        </button>
      </form>

      {generated.length ? (
        <section className="panel">
          <h2>New activation codes</h2>
          <div className="code-list">
            {generated.map((code) => (
              <code key={code}>{code}</code>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading-row">
          <div>
            <h2>Activation code list</h2>
            <p className="hint">
              Newly generated codes can be displayed in plaintext. Historical hash-only codes cannot be recovered.
            </p>
          </div>
          <button className="button secondary" disabled={!password} onClick={() => void fetchCodes()} type="button">
            Refresh
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Activation code</th>
                <th>Note</th>
                <th>Status</th>
                <th>Course</th>
                <th>Bound device</th>
                <th>Activated / last seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => {
                const display = displayActivationCode(code.label || "");
                return (
                  <tr key={code.id}>
                    <td>{display.code ? <code>{display.code}</code> : <span className="muted">Hash-only code</span>}</td>
                    <td>{display.note || "-"}</td>
                    <td>
                      <span className={`status-pill status-${code.status}`}>{statusText(code.status)}</span>
                    </td>
                    <td>{code.course_id}</td>
                    <td>
                      {code.bound_device_id ? (
                        <span title={code.bound_device_id}>{code.bound_device_id.slice(0, 18)}...</span>
                      ) : (
                        <span className="muted">Unbound</span>
                      )}
                    </td>
                    <td>
                      <div>{code.activated_at ? new Date(code.activated_at).toLocaleString() : "Not activated"}</div>
                      <div className="hint">{code.last_seen_at ? new Date(code.last_seen_at).toLocaleString() : "No visits"}</div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="button small" onClick={() => resetDevice(code.id)} type="button">
                          Reset device
                        </button>
                        <button
                          className="button small danger"
                          disabled={code.status === "disabled"}
                          onClick={() => disableCode(code.id)}
                          type="button"
                        >
                          Disable
                        </button>
                        <button className="button small danger solid-danger" onClick={() => deleteCode(code.id)} type="button">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
