/**
 * Fixture LLM provider — deterministic, no network, clearly labeled simulation.
 * Analysis claims are derived strictly from the supplied source sections (each
 * cites its evidence id); sensitive inferences are filtered; relationship needs
 * are recorded as unknown. Dialogue uses the shared fixture generator.
 */

import { generateFixtureTurn, type AgentPersona } from "@/domain/fixture-dialogue";
import { computeCompatibility, RUBRIC_VERSION } from "@/domain/ranking";
import { filterClaims } from "@/domain/sensitive";
import type { Analysis, Claim, EvaluatorOutput } from "@/domain/analysis-schema";
import type {
  AnalysisRequest,
  DateTurnRequest,
  EvaluationRequest,
  GeneratedTurn,
  LlmProvider,
  PersonaInput,
} from "./types";

const MODEL_VERSION = "fixture-sim-1.0.0";

function persona(p: PersonaInput): AgentPersona {
  return {
    participantId: p.participantId,
    displayName: p.displayName,
    interests: p.interests,
    conversationTopics: p.conversationTopics,
    relationshipNeedKnown: p.relationshipNeedKnown,
  };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export class FixtureLlmProvider implements LlmProvider {
  readonly name = "fixture";
  readonly mode = "fixture" as const;

  async generateAnalysis(req: AnalysisRequest): Promise<Analysis> {
    const now = new Date().toISOString();
    const rawClaims: Claim[] = [];
    let n = 0;
    for (const doc of req.sources) {
      for (const section of doc.sections) {
        rawClaims.push({
          id: `${req.participantId}-c${n++}`,
          category: section.kind === "profile_headline" ? "introduction" : "interest",
          text: section.text,
          evidenceIds: [section.evidenceStableId],
          disposition: "explicit",
          confidence: 0.85,
        });
      }
      for (const post of doc.postCaptions) {
        rawClaims.push({
          id: `${req.participantId}-c${n++}`,
          category: "lifestyle_activity",
          text: post.text,
          evidenceIds: [post.evidenceStableId],
          disposition: "explicit",
          confidence: 0.7,
        });
      }
    }
    const { accepted } = filterClaims(rawClaims);
    return {
      participantId: req.participantId,
      version: req.analysisVersion,
      generatedAt: now,
      modelVersion: MODEL_VERSION,
      rubricVersion: RUBRIC_VERSION,
      claims: accepted,
      unknowns: ["Relationship needs and dating preferences are not established from the sources."],
      sourceFreshness: req.sources.map((d) => ({
        platform: d.platform,
        sourceUrl: d.canonicalUrl,
        extractedAt: d.extractedAt,
        coverage: d.providerStatus === "ok" ? ("full" as const) : ("partial" as const),
      })),
    };
  }

  async generateDateTurn(req: DateTurnRequest): Promise<GeneratedTurn> {
    const turn = generateFixtureTurn({
      dateSessionId: req.dateSessionId,
      turnIndex: req.turnIndex,
      stage: req.stage,
      scenario: req.scenario,
      speaker: persona(req.speaker),
      listener: persona(req.listener),
    });
    return {
      content: turn.content,
      citedEvidenceIds: turn.citedEvidenceIds,
      modelVersion: MODEL_VERSION,
      simulated: true,
    };
  }

  async generateEvaluation(req: EvaluationRequest): Promise<EvaluatorOutput> {
    const fromLabels = new Set(req.from.interests.map((i) => i.label.toLowerCase()));
    const toLabels = new Set(req.to.interests.map((i) => i.label.toLowerCase()));
    const shared = [...fromLabels].filter((l) => toLabels.has(l));
    const denom = Math.max(1, Math.min(fromLabels.size, toLabels.size));

    const contents = req.transcript.map((t) => t.content.trim());
    const uniqueRatio = contents.length ? new Set(contents).size / contents.length : 0;
    const scenarioTurns = req.transcript.filter((t) => t.stage === "practical_scenario");
    const agree = scenarioTurns.filter((t) => !/steer away/i.test(t.content)).length;

    const dimensions = {
      sharedExplicitInterests: clamp01(shared.length / denom),
      conversationQuality: clamp01(0.5 * uniqueRatio + 0.5),
      scenarioAgreement: scenarioTurns.length
        ? clamp01(0.5 + 0.45 * (agree / scenarioTurns.length))
        : 0.7,
      complementaryInterests: shared.length === 0 && toLabels.size > 0 ? 0.3 : 0.1,
    };
    const evidenceCoverage = clamp01((req.coverage.from + req.coverage.to) / 2);
    const result = computeCompatibility({ dimensions, evidenceCoverage });

    const citedTurnIndexes = req.transcript
      .filter((t) => t.stage === "shared_interests" || t.stage === "reflection")
      .map((t) => t.turnIndex);

    return {
      fromParticipantId: req.from.participantId,
      toParticipantId: req.to.participantId,
      dimensions,
      evidenceCoverage: result.evidenceCoverage,
      citedTurnIndexes: citedTurnIndexes.length ? citedTurnIndexes : [0],
      citedEvidenceIds: req.from.interests
        .filter((i) => shared.includes(i.label.toLowerCase()))
        .map((i) => i.evidenceId),
      explanation:
        shared.length > 0
          ? `Shared interests (${shared.join(", ")}) anchored the conversation. Fit estimate, not a prediction; missing info raises uncertainty.`
          : `No explicit shared interest; fit rests on conversation quality and complementary interests. Missing info raises uncertainty.`,
      strongestSharedInterests: shared,
      importantMissingInformation: [
        `${req.to.displayName}'s relationship needs are not established from the sources.`,
      ],
      rubricVersion: RUBRIC_VERSION,
      modelVersion: MODEL_VERSION,
      generatedAt: new Date().toISOString(),
    };
  }
}
