import { z } from "zod";

/**
 * Server-side configuration. Validated once at import. Only imported by server
 * code — secrets never reach the client bundle. Defaults keep the app runnable
 * in fixture mode with no external services.
 */
const EnvSchema = z.object({
  DATABASE_URL: z.string().optional(),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  AUTH_SESSION_SECRET: z
    .string()
    .min(16)
    .default("dev-insecure-change-me-to-a-long-random-string"),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),

  LLM_PROVIDER: z.enum(["fixture", "anthropic"]).default("fixture"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5-5"),
  LLM_COST_BUDGET_USD: z.coerce.number().nonnegative().default(5),
  LLM_PRICE_INPUT_PER_MTOK: z.coerce.number().nonnegative().default(3),
  LLM_PRICE_OUTPUT_PER_MTOK: z.coerce.number().nonnegative().default(15),

  SOURCE_PROVIDER: z.enum(["fixture", "live"]).default("fixture"),
  SOURCE_PROVIDER_BASE_URL: z.string().optional(),
  SOURCE_PROVIDER_API_KEY: z.string().optional(),
  SOURCE_ALLOWED_HOSTS: z
    .string()
    .default("www.linkedin.com,linkedin.com,www.instagram.com,instagram.com"),
  SOURCE_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  SOURCE_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  SOURCE_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(86400),

  JOB_SCHEMA: z.string().default("pgboss"),
  JOB_CONCURRENCY: z.coerce.number().int().positive().default(4),

  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),

  SHOWCASE_PUBLIC: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

// Trim all string env values before validation. Secrets/flags set via some
// tooling can arrive with trailing whitespace/newlines, which would otherwise
// break strict enum checks.
const rawEnv: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]),
);

export const env: Env = EnvSchema.parse(rawEnv);

export const allowedSourceHosts: string[] = env.SOURCE_ALLOWED_HOSTS.split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** True when a real model can actually be called. */
export function llmReady(): boolean {
  return env.LLM_PROVIDER === "fixture" || Boolean(env.ANTHROPIC_API_KEY);
}

/** True when live extraction is actually configured. */
export function liveSourceReady(): boolean {
  return (
    env.SOURCE_PROVIDER === "live" &&
    Boolean(env.SOURCE_PROVIDER_BASE_URL) &&
    Boolean(env.SOURCE_PROVIDER_API_KEY)
  );
}

export function databaseReady(): boolean {
  return Boolean(env.DATABASE_URL);
}
