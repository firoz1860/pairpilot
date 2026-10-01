import { cookies } from "next/headers";
import {
  createSessionToken,
  verifySessionToken,
  sessionCookieName,
  sessionCookieOptions,
} from "./auth";

/** Server-side session helpers backed by an httpOnly cookie. */

export async function setSession(participantId: string): Promise<void> {
  const store = await cookies();
  store.set(sessionCookieName, await createSessionToken(participantId), sessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(sessionCookieName);
}

export async function getCurrentParticipantId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(sessionCookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
