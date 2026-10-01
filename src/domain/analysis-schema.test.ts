import { describe, it, expect } from "vitest";
import {
  AnalysisSchema,
  ClaimSchema,
  EvaluatorOutputSchema,
  parseOrErrors,
  type Analysis,
} from "./analysis-schema";

const now = new Date("2026-10-01T12:00:00.000Z").toISOString();

const validAnalysis: Analysis = {
  participantId: "p1",
  version: 1,
  generatedAt: now,
  modelVersion: "fixture-1.0.0",
  rubricVersion: "1.0.0",
  claims: [
    {
      id: "c1",
      category: "hobby",
      text: "enjoys trail running",
      evidenceIds: ["e1"],
      disposition: "explicit",
      confidence: 0.9,
    },
  ],
  unknowns: ["relationship needs are not established from the sources"],
  sourceFreshness: [
    {
      platform: "linkedin",
      sourceUrl: "https://www.linkedin.com/in/jane-doe",
      extractedAt: now,
      coverage: "partial",
    },
  ],
};

describe("analysis schemas", () => {
  it("accepts a well-formed analysis", () => {
    expect(AnalysisSchema.safeParse(validAnalysis).success).toBe(true);
  });

  it("rejects a claim with no evidence (every finding must cite a source)", () => {
    const bad = ClaimSchema.safeParse({
      id: "c1",
      category: "hobby",
      text: "enjoys running",
      evidenceIds: [],
      disposition: "explicit",
      confidence: 0.9,
    });
    expect(bad.success).toBe(false);
  });

  it("rejects out-of-range confidence", () => {
    const res = parseOrErrors(ClaimSchema, {
      id: "c1",
      category: "hobby",
      text: "x",
      evidenceIds: ["e1"],
      disposition: "explicit",
      confidence: 2,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join()).toMatch(/confidence/);
  });

  it("validates an evaluator output that cites turns and evidence", () => {
    const res = EvaluatorOutputSchema.safeParse({
      fromParticipantId: "p1",
      toParticipantId: "p2",
      dimensions: {
        sharedExplicitInterests: 0.8,
        conversationQuality: 0.7,
        scenarioAgreement: 0.6,
        complementaryInterests: 0.5,
      },
      evidenceCoverage: 0.7,
      citedTurnIndexes: [0, 2, 4],
      citedEvidenceIds: ["e1", "e2"],
      explanation: "Shared interest in trail running drove a concrete weekend plan.",
      rubricVersion: "1.0.0",
      modelVersion: "fixture-1.0.0",
      generatedAt: now,
    });
    expect(res.success).toBe(true);
  });

  it("requires an evaluator output to cite at least one turn", () => {
    const res = EvaluatorOutputSchema.safeParse({
      fromParticipantId: "p1",
      toParticipantId: "p2",
      dimensions: {
        sharedExplicitInterests: 0.8,
        conversationQuality: 0.7,
        scenarioAgreement: 0.6,
        complementaryInterests: 0.5,
      },
      evidenceCoverage: 0.7,
      citedTurnIndexes: [],
      citedEvidenceIds: ["e1"],
      explanation: "x",
      rubricVersion: "1.0.0",
      modelVersion: "fixture-1.0.0",
      generatedAt: now,
    });
    expect(res.success).toBe(false);
  });
});
