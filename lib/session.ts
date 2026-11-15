import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, Session } from "./types";
import { can, type Action } from "./permissions";

const COOKIE = "ms_session";
const SESSION_HOURS = 12;

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SECRET !== "1") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return new TextEncoder().encode(value ?? "medsaathi-local-development-secret-not-for-production");
}

export async function signToken(payload: Record<string, unknown>, expiresIn: string): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(secret());
}

export async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

export async function startSession(session: Session): Promise<void> {
  const token = await signToken({ ...session }, `${SESSION_HOURS}h`);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const data = await verifyToken<Session>(token);
  if (!data?.profileId || !data.memberId) return null;
  return { profileId: data.profileId, memberId: data.memberId, role: data.role as Role, name: data.name };
}

/** Use at the top of every protected page and server action. */
export async function requireSession(action: Action = "view"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.role, action)) throw new Error("You don't have permission to do that.");
  return session;
}
