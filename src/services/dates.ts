import { prisma } from "@/lib/prisma";
import { uniquePairs } from "@/domain/pairing";
import { planTurns } from "@/domain/date-state";
import { computeCompatibility, rankCandidates, type CandidateEvaluation } from "@/domain/ranking";
import { getLlmProvider } from "@/integrations/llm";
import type { PersonaInput } from "@/integrations/llm/types";

const SCENARIO = "plan a low-key weekend activity together";

async function personaFor(participantId: string): Promise<PersonaInput | null> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { analyses: { orderBy: { version: "desc" }, take: 1, include: { claims: true } } },
  });
  if (!participant) return null;
  const claims = participant.analyses[0]?.claims ?? [];
  const usable = claims.filter((c) => c.approvalStatus !== "rejected");
  return {
    participantId,
    displayName: participant.displayName,
    interests: usable
      .filter((c) => c.category === "interest" || c.category === "hobby")
      .map((c) => ({ label: c.text, evidenceId: c.evidenceStableIds[0] ?? "" })),
    conversationTopics: usable
      .filter((c) => c.category === "conversation_topic")
      .map((c) => ({ label: c.text, evidenceId: c.evidenceStableIds[0] ?? "" })),
    relationshipNeedKnown: usable.some((c) => c.category === "relationship_need"),
  };
}

/** Create a run and its pending date sessions for every unique pair. */
export async function createRun(
  label: string,
  participantIds: string[],
  kind: "fictional" | "real" = "real",
  isPublic = false,
): Promise<string> {
  const pairs = uniquePairs(participantIds);
  const run = await prisma.showcaseRun.create({
    data: {
      label,
      kind,
      participantCount: participantIds.length,
      totalPairs: pairs.length,
      status: "running",
      rubricVersion: "1.0.0",
      modelVersion: getLlmProvider().name,
      isPublic,
    },
  });
  await prisma.dateSession.createMany({
    data: pairs.map((p) => ({
      runId: run.id,
      participantAId: p.a,
      participantBId: p.b,
      pairKey: p.key,
      scenario: SCENARIO,
      totalTurns: 10,
      status: "pending" as const,
    })),
  });
  return run.id;
}

/**
 * Run (or resume) one date. Message insertion is idempotent: already-persisted
 * turns are skipped, so an interrupted run resumes without duplication.
 */
export async function runDate(dateSessionId: string): Promise<void> {
  const session = await prisma.dateSession.findUnique({
    where: { id: dateSessionId },
    include: { messages: { orderBy: { turnIndex: "asc" } } },
  });
  if (!session) throw new Error(`date ${dateSessionId} not found`);
  if (session.status === "completed") return;

  const a = await personaFor(session.participantAId);
  const b = await personaFor(session.participantBId);
  if (!a || !b) throw new Error("personas not ready for date");

  await prisma.dateSession.update({ where: { id: dateSessionId }, data: { status: "running" } });

  const llm = getLlmProvider();
  const plan = planTurns(session.totalTurns, a.participantId, b.participantId);
  const persisted = new Set(session.messages.map((m) => m.turnIndex));
  const history = session.messages.map((m) => ({
    speakerId: m.speakerParticipantId,
    content: m.content,
  }));

  for (const turn of plan) {
    if (persisted.has(turn.turnIndex)) continue;
    const isA = turn.actor === a.participantId;
    const speaker = isA ? a : b;
    const listener = isA ? b : a;
    const gen = await llm.generateDateTurn({
      dateSessionId,
      turnIndex: turn.turnIndex,
      stage: turn.stage,
      scenario: session.scenario,
      speaker,
      listener,
      history,
    });
    await prisma.dateMessage.create({
      data: {
        dateSessionId,
        turnIndex: turn.turnIndex,
        stage: turn.stage,
        speakerParticipantId: speaker.participantId,
        content: gen.content,
        citedEvidenceIds: gen.citedEvidenceIds,
        simulated: true,
      },
    });
    history.push({ speakerId: speaker.participantId, content: gen.content });
  }

  const transcript = (
    await prisma.dateMessage.findMany({ where: { dateSessionId }, orderBy: { turnIndex: "asc" } })
  ).map((m) => ({
    turnIndex: m.turnIndex,
    stage: m.stage,
    speakerId: m.speakerParticipantId,
    content: m.content,
  }));

  for (const [from, to] of [
    [a, b],
    [b, a],
  ] as const) {
    const ev = await llm.generateEvaluation({ from, to, transcript, coverage: { from: 1, to: 1 } });
    const result = computeCompatibility({ dimensions: ev.dimensions, evidenceCoverage: ev.evidenceCoverage });
    await prisma.evaluation.upsert({
      where: { dateSessionId_fromParticipantId: { dateSessionId, fromParticipantId: from.participantId } },
      create: {
        dateSessionId,
        fromParticipantId: from.participantId,
        toParticipantId: to.participantId,
        ...ev.dimensions,
        evidenceCoverage: ev.evidenceCoverage,
        compatibility: result.compatibility,
        uncertainty: result.uncertainty,
        explanation: ev.explanation,
        citedTurnIndexes: ev.citedTurnIndexes,
        citedEvidenceIds: ev.citedEvidenceIds,
        rubricVersion: ev.rubricVersion,
        modelVersion: ev.modelVersion,
      },
      update: {},
    });
  }

  await prisma.dateSession.update({
    where: { id: dateSessionId },
    data: { status: "completed", completedAt: new Date() },
  });
  await prisma.showcaseRun.update({
    where: { id: session.runId },
    data: { completedPairs: { increment: 1 } },
  });
}

/** Recompute per-participant rankings for a run from stored evaluations. */
export async function computeRankings(runId: string): Promise<void> {
  const run = await prisma.showcaseRun.findUnique({
    where: { id: runId },
    include: { dateSessions: { include: { evaluations: true } } },
  });
  if (!run) throw new Error(`run ${runId} not found`);

  const participants = new Set<string>();
  const byFromTo = new Map<
    string,
    { evaluationId: string; compatibility: number; evidenceCoverage: number; uncertainty: number; toId: string }
  >();
  for (const ds of run.dateSessions) {
    participants.add(ds.participantAId);
    participants.add(ds.participantBId);
    for (const ev of ds.evaluations) {
      byFromTo.set(`${ev.fromParticipantId}=>${ev.toParticipantId}`, {
        evaluationId: ev.id,
        compatibility: ev.compatibility,
        evidenceCoverage: ev.evidenceCoverage,
        uncertainty: ev.uncertainty,
        toId: ev.toParticipantId,
      });
    }
  }

  for (const pid of participants) {
    const cands: CandidateEvaluation[] = [];
    const meta = new Map<
      string,
      { evaluationId: string; compatibility: number; evidenceCoverage: number; uncertainty: number }
    >();
    for (const [key, v] of byFromTo) {
      if (!key.startsWith(`${pid}=>`)) continue;
      cands.push({
        candidateId: v.toId,
        result: {
          compatibility: v.compatibility,
          evidenceCoverage: v.evidenceCoverage,
          uncertainty: v.uncertainty,
          rubricVersion: "1.0.0",
        },
      });
      meta.set(v.toId, v);
    }
    for (const r of rankCandidates(cands)) {
      const m = meta.get(r.candidateId);
      if (!m) continue;
      await prisma.rankingEntry.upsert({
        where: {
          runId_forParticipantId_candidateId: { runId, forParticipantId: pid, candidateId: r.candidateId },
        },
        create: {
          runId,
          forParticipantId: pid,
          candidateId: r.candidateId,
          rank: r.rank,
          compatibility: m.compatibility,
          evidenceCoverage: m.evidenceCoverage,
          uncertainty: m.uncertainty,
          evaluationId: m.evaluationId,
        },
        update: { rank: r.rank },
      });
    }
  }

  const pending = await prisma.dateSession.count({ where: { runId, status: { not: "completed" } } });
  if (pending === 0) {
    await prisma.showcaseRun.update({
      where: { id: runId },
      data: { status: "completed", completedAt: new Date() },
    });
  }
}
