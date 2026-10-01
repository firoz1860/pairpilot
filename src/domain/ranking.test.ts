import { describe, it, expect } from "vitest";
import {
  computeCompatibility,
  rankCandidates,
  weightsSumToOne,
  RUBRIC_VERSION,
  type CandidateEvaluation,
} from "./ranking";

describe("ranking rubric", () => {
  it("dimension weights sum to 1", () => {
    expect(weightsSumToOne()).toBe(true);
  });

  it("is reproducible: identical input yields identical output", () => {
    const input = {
      dimensions: {
        sharedExplicitInterests: 0.8,
        conversationQuality: 0.6,
        scenarioAgreement: 0.5,
        complementaryInterests: 0.4,
      },
      evidenceCoverage: 0.7,
    };
    expect(computeCompatibility(input)).toEqual(computeCompatibility(input));
  });

  it("weights dimensions correctly (only shared interests = 1)", () => {
    const r = computeCompatibility({
      dimensions: {
        sharedExplicitInterests: 1,
        conversationQuality: 0,
        scenarioAgreement: 0,
        complementaryInterests: 0,
      },
      evidenceCoverage: 1,
    });
    expect(r.compatibility).toBe(35); // 0.35 weight
    expect(r.rubricVersion).toBe(RUBRIC_VERSION);
  });

  it("keeps evidence coverage SEPARATE from compatibility", () => {
    const dims = {
      sharedExplicitInterests: 0.5,
      conversationQuality: 0.5,
      scenarioAgreement: 0.5,
      complementaryInterests: 0.5,
    };
    const low = computeCompatibility({ dimensions: dims, evidenceCoverage: 0.2 });
    const high = computeCompatibility({ dimensions: dims, evidenceCoverage: 0.9 });
    expect(low.compatibility).toBe(high.compatibility); // coverage does not move the score
    expect(low.uncertainty).toBeGreaterThan(high.uncertainty); // but it moves uncertainty
    expect(low.uncertainty).toBeCloseTo(0.8, 5);
  });

  it("rejects out-of-range dimension values", () => {
    expect(() =>
      computeCompatibility({
        dimensions: {
          sharedExplicitInterests: 1.5,
          conversationQuality: 0,
          scenarioAgreement: 0,
          complementaryInterests: 0,
        },
        evidenceCoverage: 1,
      }),
    ).toThrow();
  });

  it("ranks 24 candidates with stable, deterministic ordering", () => {
    const evals: CandidateEvaluation[] = Array.from({ length: 24 }, (_, i) => ({
      candidateId: `c${String(i).padStart(2, "0")}`,
      result: computeCompatibility({
        dimensions: {
          sharedExplicitInterests: (i % 5) / 4,
          conversationQuality: 0.5,
          scenarioAgreement: 0.5,
          complementaryInterests: 0.5,
        },
        evidenceCoverage: 0.6,
      }),
    }));
    const ranked = rankCandidates(evals);
    expect(ranked).toHaveLength(24);
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[23]!.rank).toBe(24);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1]!.result.compatibility).toBeGreaterThanOrEqual(
        ranked[i]!.result.compatibility,
      );
    }
    // Deterministic across calls.
    expect(rankCandidates(evals).map((r) => r.candidateId)).toEqual(
      ranked.map((r) => r.candidateId),
    );
  });

  it("breaks ties by evidence coverage then candidateId", () => {
    const base = {
      sharedExplicitInterests: 0.5,
      conversationQuality: 0.5,
      scenarioAgreement: 0.5,
      complementaryInterests: 0.5,
    };
    const ranked = rankCandidates([
      { candidateId: "zed", result: computeCompatibility({ dimensions: base, evidenceCoverage: 0.5 }) },
      { candidateId: "amy", result: computeCompatibility({ dimensions: base, evidenceCoverage: 0.5 }) },
      { candidateId: "bob", result: computeCompatibility({ dimensions: base, evidenceCoverage: 0.9 }) },
    ]);
    expect(ranked.map((r) => r.candidateId)).toEqual(["bob", "amy", "zed"]);
  });
});
