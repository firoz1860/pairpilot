/**
 * Live source provider. Extraction runs ONLY through an authorized, compliant
 * provider API (never direct scraping of private accounts, never CAPTCHA
 * bypass). Every outbound request is SSRF-guarded: https-only, host allowlist,
 * private/metadata-range blocking, manual redirect validation, timeout, and
 * bounded retries. If the provider is not configured, it fails honestly rather
 * than fabricating content.
 */

import { assertAllowedHost, assertSafeRedirect } from "@/domain/ssrf";
import { env, liveSourceReady, allowedSourceHosts } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Platform, SourceDocument, SourceProvider } from "./types";
import { SourceUnavailableError } from "./types";

export interface GuardedFetchOptions {
  allowlist: readonly string[];
  timeoutMs: number;
  maxRetries: number;
  headers?: Record<string, string>;
}

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

/**
 * Fetch with SSRF protection. Host is validated before each request; redirects
 * are followed manually and revalidated; a timeout aborts slow requests.
 */
export async function guardedFetch(
  initialUrl: string,
  opts: GuardedFetchOptions,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  let current = initialUrl;
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt += 1) {
    try {
      for (let hop = 0; hop < 5; hop += 1) {
        const url = new URL(current);
        if (url.protocol !== "https:") {
          throw new SourceUnavailableError("only https URLs may be fetched");
        }
        assertAllowedHost(url.hostname, opts.allowlist);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
        try {
          const res = await fetchImpl(current, {
            redirect: "manual",
            signal: controller.signal,
            headers: opts.headers,
          });
          if (REDIRECT_CODES.has(res.status)) {
            const location = res.headers.get("location");
            if (!location) throw new SourceUnavailableError("redirect without location");
            const next = new URL(location, current).toString();
            assertSafeRedirect(next, opts.allowlist);
            current = next;
            continue;
          }
          return res;
        } finally {
          clearTimeout(timer);
        }
      }
      throw new SourceUnavailableError("too many redirects");
    } catch (err) {
      lastError = err;
      // SSRF and https violations are not retryable.
      if (err instanceof SourceUnavailableError || (err as Error)?.name === "SsrfError") {
        throw err;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new SourceUnavailableError("extraction failed after retries");
}

export class LiveSourceProvider implements SourceProvider {
  readonly name = "live";
  readonly mode = "live" as const;

  async fetchProfile(canonicalUrl: string, platform: Platform): Promise<SourceDocument> {
    if (!liveSourceReady()) {
      throw new SourceUnavailableError(
        "Live extraction provider is not configured (SOURCE_PROVIDER_BASE_URL / SOURCE_PROVIDER_API_KEY).",
      );
    }
    // Validate the target host up front, even though the request goes to the provider API.
    assertAllowedHost(new URL(canonicalUrl).hostname, allowedSourceHosts);

    const endpoint = new URL("/extract", env.SOURCE_PROVIDER_BASE_URL);
    endpoint.searchParams.set("url", canonicalUrl);
    endpoint.searchParams.set("platform", platform);

    const res = await guardedFetch(endpoint.toString(), {
      allowlist: [endpoint.hostname.toLowerCase()],
      timeoutMs: env.SOURCE_HTTP_TIMEOUT_MS,
      maxRetries: env.SOURCE_MAX_RETRIES,
      headers: { authorization: `Bearer ${env.SOURCE_PROVIDER_API_KEY ?? ""}` },
    });

    if (!res.ok) {
      logger.warn("live extraction non-200", { status: res.status, platform });
      throw new SourceUnavailableError(`provider responded ${res.status}`);
    }
    // The provider is expected to return a normalized SourceDocument.
    return (await res.json()) as SourceDocument;
  }
}
