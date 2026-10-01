/**
 * End-to-end workflow verification against a real database (set DATABASE_URL).
 * Exercises: onboarding + persistence, extraction + analysis, withdrawal
 * (derived-record deletion), date generation + persistence, idempotent resume,
 * and ranking persistence. Uses fixture providers (no external credentials).
 *
 * Run: npm run verify:workflow
 */
import { prisma } from "@/lib/prisma";
import { onboardParticipant } from "@/services/onboarding";
import { runExtractionAndAnalysis } from "@/services/analysis";
import { createRun, runDate, computeRankings } from "@/services/dates";
import { setClaimDecision, ClaimError } from "@/services/claims";
import { withdrawParticipant } from "@/services/withdrawal";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function main(): Promise<void> {
  console.log("1) Onboarding + persistence");
  const email = `verify+${Date.now()}@demo.pairpilot.local`;
  const { participantId } = await onboardParticipant({
    displayName: "Verify Tester",
    email,
    password: "password123",
    linkedinUrl: "https://www.linkedin.com/in/pairpilot-demo-verify",
    instagramUrl: "https://www.instagram.com/pairpilot.demo.verify",
    adultConfirmed: true,
    consentDatingSim: true,
    consentPublicShowcase: false,
    identityConfirmed: true,
  });
  const p = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { consent: true, sources: true },
  });
  assert(p && p.consent && p.sources.length === 2, "participant + consent + 2 sources persisted");

  console.log("2) Extraction + analysis (fixture provider)");
  await runExtractionAndAnalysis(participantId);
  const analysis = await prisma.analysisVersion.findFirst({
    where: { participantId },
    include: { claims: true },
  });
  assert(!!analysis && analysis.claims.length > 0, "analysis + claims persisted");
  assert(
    !!analysis && analysis.claims.every((c) => c.evidenceStableIds.length > 0),
    "every claim cites evidence",
  );
  const evidenceCount = await prisma.evidenceItem.count({
    where: { sourceProfile: { participantId } },
  });
  assert(evidenceCount > 0, "evidence items persisted");

  console.log("2b) Agent-studio claim decision (persisted + authorization)");
  const firstClaim = analysis!.claims[0]!;
  await setClaimDecision(participantId, firstClaim.id, "rejected");
  const updated = await prisma.approvedClaim.findUnique({ where: { id: firstClaim.id } });
  assert(updated?.approvalStatus === "rejected", "claim decision persisted (rejected)");
  let blocked = false;
  try {
    await setClaimDecision("someone-else", firstClaim.id, "approved");
  } catch (e) {
    blocked = e instanceof ClaimError && e.code === "forbidden";
  }
  assert(blocked, "another participant cannot edit someone else's claim (403)");

  console.log("3) Consent withdrawal deletes derived records");
  await withdrawParticipant(participantId);
  const gone = await prisma.participant.findUnique({ where: { id: participantId } });
  assert(gone === null, "participant + derived records removed");
  const orphanEvidence = await prisma.evidenceItem.count({
    where: { sourceProfile: { participantId } },
  });
  assert(orphanEvidence === 0, "no orphaned evidence after withdrawal");

  console.log("4) Date generation, idempotent resume, rankings (seeded participants)");
  const fics = await prisma.participant.findMany({
    where: { isFictional: true },
    take: 3,
    orderBy: { id: "asc" },
  });
  assert(fics.length >= 2, "seeded fictional participants present (run db:seed first)");
  const runId = await createRun(
    "verify-run",
    fics.map((f) => f.id),
    "fictional",
    false,
  );
  const sessions = await prisma.dateSession.findMany({ where: { runId }, orderBy: { pairKey: "asc" } });
  const expectedPairs = (fics.length * (fics.length - 1)) / 2;
  assert(sessions.length === expectedPairs, `created ${expectedPairs} unique pairs`);
  for (const s of sessions) await runDate(s.id);
  const msgs = await prisma.dateMessage.count({ where: { dateSession: { runId } } });
  assert(msgs > 0, "date messages persisted");

  const before = msgs;
  await runDate(sessions[0]!.id); // re-run a completed date
  const after = await prisma.dateMessage.count({ where: { dateSession: { runId } } });
  assert(after === before, "re-running a completed date adds no duplicate messages");

  await computeRankings(runId);
  const ranks = await prisma.rankingEntry.count({ where: { runId } });
  assert(ranks === fics.length * (fics.length - 1), "directional rankings persisted for each pair");

  await prisma.showcaseRun.delete({ where: { id: runId } }); // cleanup the verify run
  console.log("\nALL WORKFLOW CHECKS PASSED");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("\nWORKFLOW VERIFICATION FAILED");
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
