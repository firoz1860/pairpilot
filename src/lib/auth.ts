import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

/**
 * Authentication for participant management: bcrypt password hashing + a signed
 * JWT session stored in an httpOnly cookie. Secrets stay server-side.
 */

const SESSION_COOKIE = "pp_session";
const secretKey = new TextEncoder().encode(env.AUTH_SESSION_SECRET);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(participantId: string): Promise<string> {
  return new SignJWT({ sub: participantId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.AUTH_SESSION_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieName = SESSION_COOKIE;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: env.AUTH_SESSION_TTL_SECONDS,
  };
}
