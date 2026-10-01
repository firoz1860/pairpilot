import { env } from "@/lib/env";
import { FixtureLlmProvider } from "./fixture";
import { AnthropicLlmProvider } from "./anthropic";
import type { LlmProvider } from "./types";

/** Select the LLM provider from configuration. */
export function getLlmProvider(): LlmProvider {
  return env.LLM_PROVIDER === "anthropic" ? new AnthropicLlmProvider() : new FixtureLlmProvider();
}

export * from "./types";
