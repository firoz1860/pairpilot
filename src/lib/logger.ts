/**
 * Minimal structured logger. Emits single-line JSON and redacts obvious secret
 * keys so credentials and tokens never land in logs.
 */

type Level = "debug" | "info" | "warn" | "error";

const REDACT_KEYS = /(password|secret|token|api[_-]?key|authorization|cookie)/i;

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.test(k) ? "[redacted]" : redact(v);
    }
    return out;
  }
  return value;
}

function emit(level: Level, message: string, context?: Record<string, unknown>): void {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: redact(context) as Record<string, unknown> } : {}),
  };
  const serialized = JSON.stringify(line);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => emit("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => emit("error", m, c),
};
