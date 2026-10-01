import { z } from "zod";

/**
 * Zod schemas for every LLM / extraction output. All generated content is
 * validated against these before it is stored or shown, so malformed or
 * out-of-contract model output is rejected rather than trusted.
 */

export const PlatformSchema = z.enum(["linkedin", "instagram"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const EvidenceKindSchema = z.enum([
  "profile_headline",
  "profile_bio",
  "profile_section",
  "post_caption",
  "experience",
  "education",
]);

/** A single piece of extracted, source-backed evidence. */
export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  /** Stable identifier so the same evidence re-extracted keeps its reference. */
  stableId: z.string().min(1),
  sourceUrl: z.string().url(),
  platform: PlatformSchema,
  kind: EvidenceKindSchema,
  excerpt: z.string().min(1).max(2000),
  extractedAt: z.string().datetime(),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const ClaimCategorySchema = z.enum([
  "introduction",
  "hobby",
  "interest",
  "professional_background",
  "lifestyle_activity",
  "conversation_topic",
  "relationship_need",
]);
export type ClaimCategory = z.infer<typeof ClaimCategorySchema>;

export const ClaimDispositionSchema = z.enum(["explicit", "tentative_interpretation"]);

/**
 * A finding in a profile analysis. Every finding must cite at least one
 * evidence item, state whether it is explicit or a tentative (non-sensitive)
 * interpretation, and carry confidence + limitations.
 */
export const ClaimSchema = z.object({
  id: z.string().min(1),
  category: ClaimCategorySchema,
  text: z.string().min(1).max(600),
  evidenceIds: z.array(z.string().min(1)).min(1),
  disposition: ClaimDispositionSchema,
  confidence: z.number().min(0).max(1),
  limitations: z.string().max(600).optional(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const SourceFreshnessSchema = z.object({
  platform: PlatformSchema,
  sourceUrl: z.string().url(),
  extractedAt: z.string().datetime(),
  coverage: z.enum(["full", "partial", "unavailable"]),
  note: z.string().max(400).optional(),
});

/** A full, versioned analysis for one participant. */
export const AnalysisSchema = z.object({
  participantId: z.string().min(1),
  version: z.number().int().positive(),
  generatedAt: z.string().datetime(),
  modelVersion: z.string().min(1),
  rubricVersion: z.string().min(1),
  claims: z.array(ClaimSchema),
  unknowns: z.array(z.string().min(1)),
  sourceFreshness: z.array(SourceFreshnessSchema),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const DimensionScoresSchema = z.object({
  sharedExplicitInterests: z.number().min(0).max(1),
  conversationQuality: z.number().min(0).max(1),
  scenarioAgreement: z.number().min(0).max(1),
  complementaryInterests: z.number().min(0).max(1),
});

/** One directional evaluation produced by the evaluator agent. */
export const EvaluatorOutputSchema = z.object({
  fromParticipantId: z.string().min(1),
  toParticipantId: z.string().min(1),
  dimensions: DimensionScoresSchema,
  evidenceCoverage: z.number().min(0).max(1),
  citedTurnIndexes: z.array(z.number().int().nonnegative()).min(1),
  citedEvidenceIds: z.array(z.string().min(1)),
  explanation: z.string().min(1).max(2000),
  strongestSharedInterests: z.array(z.string()).default([]),
  importantMissingInformation: z.array(z.string()).default([]),
  rubricVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
});
export type EvaluatorOutput = z.infer<typeof EvaluatorOutputSchema>;

/** A single generated date message (simulated — never a statement by the real person). */
export const DateMessageSchema = z.object({
  turnIndex: z.number().int().nonnegative(),
  stage: z.enum(["introduction", "shared_interests", "practical_scenario", "reflection"]),
  speakerParticipantId: z.string().min(1),
  content: z.string().min(1).max(2000),
  citedEvidenceIds: z.array(z.string()).default([]),
  simulated: z.literal(true),
});
export type DateMessage = z.infer<typeof DateMessageSchema>;

/** Safe-parse helper that returns a typed result or a flat list of error messages. */
export function parseOrErrors<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { ok: true; value: T } | { ok: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}
