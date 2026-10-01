/**
 * Deterministic fixture evaluator. Produces one directional evaluation from the
 * two profiles + the transcript, using the real ranking rubric
 * (`computeCompatibility`). Dimension scores are derived from observable signals
 * (shared-interest ratio, interest adjacency, transcript substance, scenario
 * agreement) and source coverage — never from appearance, wealth, or any
 * sensitive attribute. Every evaluation cites transcript turns and evidence.
 */

import { computeCompatibility, RUBRIC_VERSION } from "@/domain/ranking";
import { INTEREST_ADJACENCY } from "./fictional-participants";
import { MODEL_VERSION, GENERATED_AT } from "./generator";
import type { ShowcaseEvaluation, ShowcaseMessage, ShowcaseParticipant } from "./types";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

function labels(p: ShowcaseParticipant): string[] {
  return p.interests.map((i) => i.label.toLowerCase());
}

function sharedLabels(a: ShowcaseParticipant, b: ShowcaseParticipant): string[] {
  const bSet = new Set(labels(b));
  return labels(a).filter((l) => bSet.has(l));
}

function complementaryScore(from: ShowcaseParticipant, to: ShowcaseParticipant): number {
  const toSet = new Set(labels(to));
  const fromLabels = labels(from);
  const shared = new Set(sharedLabels(from, to));
  let related = 0;
  for (const tag of fromLabels) {
    if (shared.has(tag)) continue;
    const adj = INTEREST_ADJACENCY[tag] ?? [];
    if (adj.some((a) => toSet.has(a))) related += 1;
  }
  return clamp01(related / Math.max(1, fromLabels.length));
}

function conversationQuality(messages: ShowcaseMessage[]): number {
  if (messages.length === 0) return 0;
  const contents = messages.map((m) => m.content.trim());
  const uniqueRatio = new Set(contents).size / contents.length;
  const avgLen = contents.reduce((acc, c) => acc + c.length, 0) / contents.length;
  const lengthFactor = clamp01(avgLen / 160);
  return clamp01(0.55 * uniqueRatio + 0.35 * lengthFactor + 0.1);
}

function scenarioAgreement(messages: ShowcaseMessage[]): number {
  const scenarioMsgs = messages.filter((m) => m.stage === "practical_scenario");
  if (scenarioMsgs.length === 0) return 0.7;
  const agree = scenarioMsgs.filter((m) => !/steer away/i.test(m.content)).length;
  return clamp01(0.5 + 0.45 * (agree / scenarioMsgs.length));
}

export function evaluateDirection(
  from: ShowcaseParticipant,
  to: ShowcaseParticipant,
  messages: ShowcaseMessage[],
): ShowcaseEvaluation {
  const shared = sharedLabels(from, to);
  const denom = Math.max(1, Math.min(from.interests.length, to.interests.length));

  const dimensions = {
    sharedExplicitInterests: round3(clamp01(shared.length / denom)),
    conversationQuality: round3(conversationQuality(messages)),
    scenarioAgreement: round3(scenarioAgreement(messages)),
    complementaryInterests: round3(complementaryScore(from, to)),
  };
  const evidenceCoverage = round3((from.evidenceCoverageSelf + to.evidenceCoverageSelf) / 2);

  const result = computeCompatibility({ dimensions, evidenceCoverage });

  // Cite the shared-interest turn, the scenario turn, and the reflection turn.
  const citedTurnIndexes = [
    messages.find((m) => m.stage === "shared_interests")?.turnIndex,
    messages.find((m) => m.stage === "practical_scenario")?.turnIndex,
    messages.find((m) => m.stage === "reflection")?.turnIndex,
  ].filter((n): n is number => typeof n === "number");
  if (citedTurnIndexes.length === 0 && messages[0]) citedTurnIndexes.push(messages[0].turnIndex);

  // Cite the `from` participant's evidence backing each shared interest.
  const citedEvidenceIds = from.interests
    .filter((i) => shared.includes(i.label.toLowerCase()))
    .map((i) => i.evidenceId);

  const missing = [
    `${to.displayName}'s relationship needs are not established from the sources.`,
    ...(evidenceCoverage < 1
      ? ["Evidence coverage is partial for at least one participant, so uncertainty is higher."]
      : []),
  ];

  const explanation =
    shared.length > 0
      ? `Strongest shared ground: ${shared.join(", ")}. The conversation stayed grounded in sourced interests and ${
          dimensions.scenarioAgreement >= 0.8 ? "reached agreement" : "surfaced a respectful difference"
        } on the scenario. Compatibility reflects fit, not a prediction of a relationship; missing information raises uncertainty rather than lowering the score.`
      : `No explicitly shared interest; fit rests on complementary interests (${round3(
          dimensions.complementaryInterests,
        )}) and conversation quality. Missing information raises uncertainty rather than counting as incompatibility.`;

  return {
    fromId: from.id,
    toId: to.id,
    dimensions,
    evidenceCoverage: result.evidenceCoverage,
    compatibility: result.compatibility,
    uncertainty: result.uncertainty,
    explanation,
    citedTurnIndexes,
    citedEvidenceIds,
    strongestSharedInterests: shared,
    importantMissingInformation: missing,
    rubricVersion: RUBRIC_VERSION,
    modelVersion: MODEL_VERSION,
    generatedAt: GENERATED_AT,
  };
}
