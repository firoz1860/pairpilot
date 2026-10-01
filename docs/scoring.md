# Scoring & ranking rubric

**Rubric version: 1.0.0** (stored on every evaluation; see `src/domain/ranking.ts`).

The compatibility score is an **explainable estimate of conversational + interest fit** over the two
participants' source-backed profiles. It is **not** a probability of love, attraction, or a successful
relationship.

## Dimensions and weights

| Dimension | Weight | Meaning |
|---|---|---|
| `sharedExplicitInterests` | 0.35 | Overlap in explicitly-stated interests/hobbies |
| `conversationQuality` | 0.30 | Substance and reciprocity of the simulated conversation |
| `scenarioAgreement` | 0.20 | Agreement reached on the practical-scenario stage |
| `complementaryInterests` | 0.15 | Compatible (non-identical) source-backed interests |

Weights sum to 1.0 (unit-tested). Each dimension is in `[0,1]`. Compatibility = weighted sum × 100.

## Evidence coverage is separate

`evidenceCoverage` (0..1) measures how much of the two profiles was backed by real evidence. It is
**never folded into the compatibility score**. Instead it drives `uncertainty = 1 − evidenceCoverage`.
Missing information increases uncertainty; it never counts as incompatibility.

## Never used as inputs

Appearance, wealth, employer prestige, follower counts, and any protected/sensitive attribute
(orientation, health, religion, ethnicity, politics, relationship status). Sensitive content is filtered
out of analyses before scoring (`src/domain/sensitive.ts`).

## Stored for every directional evaluation

Directional score, dimension scores, evidence coverage, explanation, transcript turn references, cited
evidence ids, rubric version, model version, generation timestamp. Because `computeCompatibility` is a
pure function of the stored evaluator output, **every ranking is reproducible** from stored data.

## Ranking order

Candidates are ranked by: compatibility (desc) → evidence coverage (desc) → candidateId (asc, stable
tiebreak). Each fully-eligible participant in a 25-person run is ranked against the other 24. If
eligibility reduces the pool, the reduced candidate count is shown and explained; partial rankings are
marked provisional until the run completes.

## Fixture evaluator (no-LLM mode)

When `LLM_PROVIDER=fixture`, dimension scores are computed deterministically from the transcript and the
two profiles (shared-interest ratio, turn substance/variety, scenario-agreement signal, interest
adjacency, source coverage). This yields real, explainable, reproducible numbers without a model, and is
clearly labeled as simulation output.
