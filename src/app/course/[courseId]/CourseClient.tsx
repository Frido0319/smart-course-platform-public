"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getOrCreateDeviceId } from "@/lib/device";

type Props = {
  courseId: string;
};

export function CourseClient({ courseId }: Props) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [message, setMessage] = useState("Checking device authorization...");

  async function checkAccess() {
    setChecking(true);
    setAuthorized(false);
    setFrameLoaded(false);
    setMessage("Checking device authorization...");
    try {
      const deviceId = getOrCreateDeviceId();
      const check = await fetch("/api/session/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      const checkData = (await check.json().catch(() => ({}))) as { message?: string; courseId?: string };
      if (!check.ok) {
        setMessage(checkData.message || "Authorization check failed.");
        return;
      }

      if (checkData.courseId !== courseId) {
        setMessage("The current session does not match this course.");
        return;
      }

      setAuthorized(true);
      setMessage("");
    } catch {
      setMessage("Network error. Unable to verify authorization.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkAccess();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setAuthorized(false);
    router.push("/activate");
  }

  if (!authorized) {
    return (
      <section className="panel course-auth-panel">
        <p className="eyebrow">Authorization</p>
        <h2>Course authorization</h2>
        <p className={checking ? "muted" : "error"}>{message}</p>
        {!checking ? (
          <p className="hint">
            If you changed devices, cleared browser storage, or used another student code, activate again or reset the
            device binding from the admin console.
          </p>
        ) : null}
        <div className="auth-actions">
          <Link className="button primary" href="/activate">
            Enter activation code
          </Link>
          <button className="button secondary" disabled={checking} onClick={checkAccess} type="button">
            Re-check authorization
          </button>
          <button className="button secondary" onClick={logout} type="button">
            Log out current session
          </button>
          <Link className="button secondary" href="/">
            Back home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="course-frame-shell">
      <section className="course-frame-bar">
        <div>
          <p className="eyebrow">Course</p>
          <h1>Smart Manufacturing Foundations</h1>
          <p className="muted">Access granted. The protected course HTML loads inside the frame below.</p>
        </div>
        <button className="button secondary" onClick={logout} type="button">
          Log out
        </button>
      </section>
      <div className="course-frame-wrap" aria-busy={!frameLoaded}>
        {!frameLoaded ? (
          <div className="course-frame-loading" role="status">
            Loading protected course HTML. Private course media can be served through the protected asset API.
          </div>
        ) : null}
        <iframe
          className="course-frame"
          onLoad={() => setFrameLoaded(true)}
          src="/api/course/html"
          title="Smart Manufacturing Foundations interactive course"
        />
      </div>
    </section>
  );
}
