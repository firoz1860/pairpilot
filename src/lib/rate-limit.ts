import { env } from "./env";

/**
 * Simple in-memory fixed-window rate limiter. Suitable for a single instance /
 * demo; for multi-instance production, back it with Redis. Keyed by caller
 * identity + route.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  max = env.RATE_LIMIT_MAX_REQUESTS,
  windowSeconds = env.RATE_LIMIT_WINDOW_SECONDS,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: max - 1, resetAt };
  }
  existing.count += 1;
  const ok = existing.count <= max;
  return { ok, remaining: Math.max(0, max - existing.count), resetAt: existing.resetAt };
}

/** Best-effort client identity from standard proxy headers. */
export function clientKey(headers: Headers, route: string): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || headers.get("x-real-ip") || "unknown";
  return `${route}:${ip}`;
}
