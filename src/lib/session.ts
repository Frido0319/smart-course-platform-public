import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { requireEnv } from "./env";
import type { SessionPayload } from "./types";

const cookieName = "scp_session";

function encodedSecret() {
  return new TextEncoder().encode(requireEnv("SESSION_SECRET"));
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedSecret());

  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret(), { algorithms: ["HS256"] });
    if (
      typeof payload.activationCodeId !== "string" ||
      typeof payload.courseId !== "string" ||
      typeof payload.deviceId !== "string" ||
      (payload.role !== "student" && payload.role !== "admin")
    ) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}
