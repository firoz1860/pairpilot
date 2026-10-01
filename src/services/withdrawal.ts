import { prisma } from "@/lib/prisma";

/**
 * Consent withdrawal. Deletes the participant and all derived records — their
 * sources/evidence/analyses/agent (via cascade), plus any date sessions,
 * evaluations, and ranking entries that reference them in either direction.
 */
export async function withdrawParticipant(participantId: string): Promise<void> {
  await prisma.$transaction([
    prisma.rankingEntry.deleteMany({
      where: { OR: [{ forParticipantId: participantId }, { candidateId: participantId }] },
    }),
    prisma.evaluation.deleteMany({
      where: { OR: [{ fromParticipantId: participantId }, { toParticipantId: participantId }] },
    }),
    prisma.dateSession.deleteMany({
      where: { OR: [{ participantAId: participantId }, { participantBId: participantId }] },
    }),
    // Cascades consent, sources, evidence, analyses, claims, agent, deletionRequest.
    prisma.participant.delete({ where: { id: participantId } }),
  ]);
}
