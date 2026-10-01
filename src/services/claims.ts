import { prisma } from "@/lib/prisma";

/**
 * Agent-studio claim decisions. A participant may approve, flag, or reject their
 * OWN extracted claims. Corrections only change a claim's status — they never
 * add new biographical sources. Ownership is enforced here.
 */
export type ClaimDecision = "approved" | "rejected" | "flagged";

export class ClaimError extends Error {
  readonly code: "not_found" | "forbidden";
  constructor(code: "not_found" | "forbidden", message: string) {
    super(message);
    this.name = "ClaimError";
    this.code = code;
  }
}

export async function setClaimDecision(
  participantId: string,
  claimId: string,
  decision: ClaimDecision,
): Promise<void> {
  const claim = await prisma.approvedClaim.findUnique({
    where: { id: claimId },
    include: { analysis: { select: { participantId: true } } },
  });
  if (!claim) throw new ClaimError("not_found", "claim not found");
  if (claim.analysis.participantId !== participantId) {
    throw new ClaimError("forbidden", "you may only edit your own claims");
  }
  await prisma.approvedClaim.update({
    where: { id: claimId },
    data: { approvalStatus: decision },
  });
}
