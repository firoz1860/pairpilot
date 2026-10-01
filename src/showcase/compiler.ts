/**
 * Deterministic showcase compiler.
 *
 * Runs the REAL engine end to end for 25 fictional participants:
 *   participants → agents → all C(25,2)=300 dates → 600 directional
 *   evaluations → per-participant rankings (24 each).
 * Output is a function of fixed seeds only, so compiling twice yields identical
 * data. This is what makes the showcase real, reproducible, and DB-free.
 */

import { uniquePairs } from "@/domain/pairing";
import { planTurns } from "@/domain/date-state";
import { generateFixtureTurn, type AgentPersona } from "@/domain/fixture-dialogue";
import { seededRng, pick } from "@/lib/seeded-random";
import { rankCandidates, type CandidateEvaluation } from "@/domain/ranking";
import { FICTIONAL_SEEDS } from "./fictional-participants";
import { buildParticipant, GENERATED_AT, MODEL_VERSION, RUBRIC_VERSION } from "./generator";
import { evaluateDirection } from "./evaluator";
import type {
  CompiledShowcase,
  ShowcaseDate,
  ShowcaseEvaluation,
  ShowcaseMessage,
  ShowcaseParticipant,
  ShowcaseRanking,
} from "./types";

const SCENARIOS = [
  "plan a Saturday morning activity together",
  "choose a low-key weekend trip",
  "pick a meal to cook or share",
  "plan a small weekend project to collaborate on",
  "plan a relaxed first meetup",
];

function personaOf(p: ShowcaseParticipant): AgentPersona {
  return {
    participantId: p.id,
    displayName: p.displayName,
    interests: p.interests,
    conversationTopics: p.conversationTopics,
    relationshipNeedKnown: p.relationshipNeedKnown,
  };
}

function buildDate(a: ShowcaseParticipant, b: ShowcaseParticipant): ShowcaseDate {
  const pairKey = a.id < b.id ? `${a.id}::${b.id}` : `${b.id}::${a.id}`;
  const dateId = `date-${a.id}-${b.id}`;
  const scenario = pick(seededRng(`${pairKey}-scenario`), SCENARIOS);
  const totalTurns = 8 + Math.floor(seededRng(`${pairKey}-turns`)() * 5); // 8..12

  const personaA = personaOf(a);
  const personaB = personaOf(b);
  const plan = planTurns(totalTurns, a.id, b.id);

  const messages: ShowcaseMessage[] = plan.map((turn) => {
    const isA = turn.actor === a.id;
    const speaker = isA ? personaA : personaB;
    const listener = isA ? personaB : personaA;
    const gen = generateFixtureTurn({
      dateSessionId: dateId,
      turnIndex: turn.turnIndex,
      stage: turn.stage,
      speaker,
      listener,
      scenario,
    });
    return {
      turnIndex: turn.turnIndex,
      stage: turn.stage,
      speakerId: speaker.participantId,
      speakerName: speaker.displayName,
      content: gen.content,
      citedEvidenceIds: gen.citedEvidenceIds,
      simulated: true,
    };
  });

  const evaluations: ShowcaseEvaluation[] = [
    evaluateDirection(a, b, messages),
    evaluateDirection(b, a, messages),
  ];

  return {
    id: dateId,
    pairKey,
    participantAId: a.id,
    participantBId: b.id,
    aName: a.displayName,
    bName: b.displayName,
    scenario,
    status: "completed",
    totalTurns,
    messages,
    evaluations,
  };
}

export function compileShowcase(): CompiledShowcase {
  const participants = FICTIONAL_SEEDS.map((seed, i) => buildParticipant(seed, i));
  const byId = new Map(participants.map((p) => [p.id, p]));
  const ids = participants.map((p) => p.id);
  const pairs = uniquePairs(ids);

  const dates: ShowcaseDate[] = pairs.map((pair) =>
    buildDate(byId.get(pair.a) as ShowcaseParticipant, byId.get(pair.b) as ShowcaseParticipant),
  );

  // Index each directional evaluation by from=>to for ranking + navigation.
  const evalIndex = new Map<string, { dateId: string; evaluation: ShowcaseEvaluation }>();
  for (const date of dates) {
    for (const evaluation of date.evaluations) {
      evalIndex.set(`${evaluation.fromId}=>${evaluation.toId}`, { dateId: date.id, evaluation });
    }
  }

  const rankings: ShowcaseRanking[] = participants.map((p) => {
    const candidateEvals: CandidateEvaluation[] = participants
      .filter((c) => c.id !== p.id)
      .map((c) => {
        const found = evalIndex.get(`${p.id}=>${c.id}`);
        if (!found) throw new Error(`missing evaluation ${p.id}=>${c.id}`);
        return {
          candidateId: c.id,
          result: {
            compatibility: found.evaluation.compatibility,
            evidenceCoverage: found.evaluation.evidenceCoverage,
            uncertainty: found.evaluation.uncertainty,
            rubricVersion: found.evaluation.rubricVersion,
          },
        };
      });

    const ranked = rankCandidates(candidateEvals);
    const entries = ranked.map((r) => {
      const found = evalIndex.get(`${p.id}=>${r.candidateId}`);
      const evaluation = found!.evaluation;
      return {
        rank: r.rank,
        candidateId: r.candidateId,
        candidateName: byId.get(r.candidateId)?.displayName ?? r.candidateId,
        compatibility: evaluation.compatibility,
        evidenceCoverage: evaluation.evidenceCoverage,
        uncertainty: evaluation.uncertainty,
        dateId: found!.dateId,
        strongestSharedInterests: evaluation.strongestSharedInterests,
        importantMissingInformation: evaluation.importantMissingInformation,
      };
    });

    return { forParticipantId: p.id, forName: p.displayName, entries, provisional: false };
  });

  return {
    meta: {
      label: "PairPilot fictional showcase",
      kind: "fictional",
      participantCount: participants.length,
      totalPairs: pairs.length,
      completedPairs: dates.length,
      rubricVersion: RUBRIC_VERSION,
      modelVersion: MODEL_VERSION,
      generatedAt: GENERATED_AT,
      isPublic: true,
      note: "All 25 participants are clearly-labeled fictional personas. No real person is profiled. Dialogue is a deterministic simulation, not real human conversation.",
    },
    participants,
    dates,
    rankings,
  };
}
