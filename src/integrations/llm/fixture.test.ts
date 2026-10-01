import { describe, it, expect } from "vitest";
import { FixtureLlmProvider } from "./fixture";
import { AnalysisSchema, EvaluatorOutputSchema } from "@/domain/analysis-schema";
import { classifySensitive } from "@/domain/sensitive";
import type { SourceDocument } from "@/integrations/source/types";
import type { PersonaInput } from "./types";

const provider = new FixtureLlmProvider();

const doc: SourceDocument = {
  canonicalUrl: "https://www.linkedin.com/in/pairpilot-demo-jane",
  platform: "linkedin",
  sections: [
    { kind: "profile_headline", text: "Backend engineer (fictional).", evidenceStableId: "e-head" },
    { kind: "profile_section", text: "Into trail running and coffee.", evidenceStableId: "e-about" },
  ],
  postCaptions: [],
  extractedAt: "2026-09-15T10:00:00.000Z",
  providerStatus: "ok",
  limitations: [],
};

const jane: PersonaInput = {
  participantId: "p1",
  displayName: "Jane",
  interests: [{ label: "trail running", evidenceId: "e-about" }],
  conversationTopics: [],
  relationshipNeedKnown: false,
};
const amir: PersonaInput = {
  participantId: "p2",
  displayName: "Amir",
  interests: [{ label: "trail running", evidenceId: "x1" }],
  conversationTopics: [],
  relationshipNeedKnown: false,
};

describe("fixture LLM provider", () => {
  it("produces a schema-valid analysis whose claims cite evidence", async () => {
    const analysis = await provider.generateAnalysis({
      participantId: "p1",
      displayName: "Jane",
      analysisVersion: 1,
      sources: [doc],
    });
    expect(AnalysisSchema.safeParse(analysis).success).toBe(true);
    expect(analysis.claims.length).toBeGreaterThan(0);
    expect(analysis.claims.every((c) => c.evidenceIds.length > 0)).toBe(true);
    expect(analysis.unknowns.join(" ").toLowerCase()).toContain("relationship needs");
    for (const c of analysis.claims) expect(classifySensitive(c.text)).toEqual([]);
  });

  it("generates a simulated date turn", async () => {
    const turn = await provider.generateDateTurn({
      dateSessionId: "d1",
      turnIndex: 0,
      stage: "introduction",
      scenario: "plan a weekend",
      speaker: jane,
      listener: amir,
      history: [],
    });
    expect(turn.simulated).toBe(true);
    expect(turn.content).toContain("Jane's agent");
  });

  it("produces a schema-valid evaluation citing turns", async () => {
    const evaluation = await provider.generateEvaluation({
      from: jane,
      to: amir,
      transcript: [
        { turnIndex: 0, stage: "introduction", speakerId: "p1", content: "hi" },
        { turnIndex: 1, stage: "shared_interests", speakerId: "p2", content: "trail running" },
        { turnIndex: 2, stage: "reflection", speakerId: "p1", content: "good fit" },
      ],
      coverage: { from: 1, to: 1 },
    });
    expect(EvaluatorOutputSchema.safeParse(evaluation).success).toBe(true);
    expect(evaluation.citedTurnIndexes.length).toBeGreaterThan(0);
    expect(evaluation.strongestSharedInterests).toContain("trail running");
  });
});
