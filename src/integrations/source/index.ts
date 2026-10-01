import { env } from "@/lib/env";
import { FixtureSourceProvider } from "./fixture";
import { LiveSourceProvider } from "./live";
import type { SourceProvider } from "./types";

/** Select the source provider from configuration. */
export function getSourceProvider(): SourceProvider {
  return env.SOURCE_PROVIDER === "live" ? new LiveSourceProvider() : new FixtureSourceProvider();
}

export * from "./types";
