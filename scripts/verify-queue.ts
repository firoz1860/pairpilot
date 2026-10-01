/**
 * Verify the durable-queue loop against a real database (set DATABASE_URL):
 * onboarding enqueues an analysis job → a pg-boss worker consumes it →
 * extraction + analysis persist evidence and claims → graceful shutdown.
 * Uses fixture providers (no external credentials). Cleans up after itself.
 *
 * Run: npm run verify:queue
 */
import PgBoss from "pg-boss";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { onboardParticipant } from "@/services/onboarding";
import { enqueueAnalysis, QUEUES } from "@/lib/queue";
import { runExtractionAndAnalysis } from "@/services/analysis";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  const email = `queue+${Date.now()}@demo.pairpilot.local`;
  const { participantId } = await onboardParticipant({
    displayName: "Queue Tester",
    email,
    password: "password123",
    linkedinUrl: "https://www.linkedin.com/in/pairpilot-demo-queue",
    instagramUrl: "https://www.instagram.com/pairpilot.demo.queue",
    adultConfirmed: true,
    consentDatingSim: true,
    consentPublicShowcase: false,
    identityConfirmed: true,
  });
  console.log(`onboarded ${participantId}`);
  const jobId = await enqueueAnalysis(participantId);
  console.log(`enqueued analysis job: ${jobId}`);

  const connUrl = new URL(env.DATABASE_URL as string);
  connUrl.searchParams.delete("sslmode");
  const isLocal = ["localhost", "127.0.0.1"].includes(connUrl.hostname);
  const boss = new PgBoss({
    connectionString: connUrl.toString(),
    schema: env.JOB_SCHEMA,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
  await boss.start();
  for (const q of Object.values(QUEUES)) await boss.createQueue(q);
  let processed = false;
  await boss.work<{ participantId: string }>(QUEUES.analysis, { batchSize: 1 }, async (jobs) => {
    for (const j of jobs) {
      await runExtractionAndAnalysis(j.data.participantId);
      processed = true;
    }
  });

  let claims = 0;
  let evidence = 0;
  for (let i = 0; i < 30 && claims === 0; i++) {
    await sleep(1000);
    claims = await prisma.approvedClaim.count({ where: { analysis: { participantId } } });
    evidence = await prisma.evidenceItem.count({ where: { sourceProfile: { participantId } } });
  }
  console.log(`worker processed=${processed} evidence=${evidence} claims=${claims}`);

  await boss.stop({ graceful: true, wait: true });
  console.log("worker stopped gracefully");

  const ok = processed && claims > 0 && evidence > 0;
  console.log(ok ? "QUEUE E2E PASS" : "QUEUE E2E FAIL");

  await prisma.participant.delete({ where: { id: participantId } }).catch(() => {});
  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
