/**
 * Compatibility ranking from evaluator outputs.
 *
 * Design rules (see docs/scoring.md):
 *  - The compatibility score is a weighted blend of FOUR dimensions that
 *    describe conversational and interest fit.
 *  - Evidence coverage is kept SEPARATE from compatibility. Missing
 *    information raises uncertainty; it never counts as incompatibility.
 *  - The score is NOT a probability of love or a prediction of a successful
 *    relationship. It is an explainable fit estimate over the sources.
 *  - Appearance, wealth, employer prestige, follower counts, and protected or
 *    sensitive attributes are never inputs.
 *  - Computation is pure and reproducible from stored evaluator outputs.
 */

export const RUBRIC_VERSION = "1.0.0";

export interface DimensionScores {
  /** Overlap in explicitly-stated interests/hobbies (0..1). */
  sharedExplicitInterests: number;
  /** Quality of the simulated conversation: substance, reciprocity (0..1). */
  conversationQuality: number;
  /** Agreement reached on the practical scenario stage (0..1). */
  scenarioAgreement: number;
  /** Complementary (non-identical but compatible) source-backed interests (0..1). */
  complementaryInterests: number;
}

export const DIMENSION_WEIGHTS: Readonly<Record<keyof DimensionScores, number>> = {
  sharedExplicitInterests: 0.35,
  conversationQuality: 0.3,
  scenarioAgreement: 0.2,
  complementaryInterests: 0.15,
};

export const DIMENSION_KEYS = Object.keys(DIMENSION_WEIGHTS) as Array<keyof DimensionScores>;

/** The dimension weights are a probability-style distribution and must sum to 1. */
export function weightsSumToOne(): boolean {
  const sum = DIMENSION_KEYS.reduce((acc, k) => acc + DIMENSION_WEIGHTS[k], 0);
  return Math.abs(sum - 1) < 1e-9;
}

export interface EvaluationInput {
  dimensions: DimensionScores;
  /** 0..1 — how much of the two profiles was backed by real evidence. */
  evidenceCoverage: number;
}

export interface CompatibilityResult {
  /** 0..100, weighted dimensions only (evidence coverage excluded). */
  compatibility: number;
  /** 0..1, stored alongside the score but never folded into it. */
  evidenceCoverage: number;
  /** 0..1, higher when evidence coverage is low. */
  uncertainty: number;
  rubricVersion: string;
}

function assertUnit(value: number, name: string): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be a number in [0, 1], received ${value}`);
  }
  return value;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Deterministically compute a compatibility result from one directional evaluation. */
export function computeCompatibility(input: EvaluationInput): CompatibilityResult {
  const d = input.dimensions;
  let weighted = 0;
  for (const key of DIMENSION_KEYS) {
    weighted += assertUnit(d[key], `dimensions.${key}`) * DIMENSION_WEIGHTS[key];
  }
  const evidenceCoverage = assertUnit(input.evidenceCoverage, "evidenceCoverage");
  return {
    compatibility: round2(weighted * 100),
    evidenceCoverage: round2(evidenceCoverage),
    uncertainty: round2(1 - evidenceCoverage),
    rubricVersion: RUBRIC_VERSION,
  };
}

export interface CandidateEvaluation {
  candidateId: string;
  result: CompatibilityResult;
}

export interface RankingEntry extends CandidateEvaluation {
  rank: number;
}

/**
 * Rank candidates for one participant. Deterministic ordering:
 *   1. compatibility desc
 *   2. evidence coverage desc (more certain wins ties)
 *   3. candidateId asc (stable final tiebreak)
 */
export function rankCandidates(evaluations: readonly CandidateEvaluation[]): RankingEntry[] {
  const sorted = [...evaluations].sort((x, y) => {
    if (y.result.compatibility !== x.result.compatibility) {
      return y.result.compatibility - x.result.compatibility;
    }
    if (y.result.evidenceCoverage !== x.result.evidenceCoverage) {
      return y.result.evidenceCoverage - x.result.evidenceCoverage;
    }
    if (x.candidateId < y.candidateId) return -1;
    if (x.candidateId > y.candidateId) return 1;
    return 0;
  });
  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
