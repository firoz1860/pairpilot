/**
 * Complete every pending date in a run and compute rankings — without the
 * long-running pg-boss worker. Useful to populate a run in the database.
 * Run: npm run complete:run [runId]   (defaults to the latest non-completed run)
 */
import { prisma } from "@/lib/prisma";
import { runDate, computeRankings } from "@/services/dates";

async function main(): Promise<void> {
  const argId = process.argv[2];
  const runId =
    argId ??
    (await prisma.showcaseRun.findFirst({
      where: { status: { not: "completed" } },
      orderBy: { createdAt: "desc" },
    }))?.id;
  if (!runId) {
    console.error("no run to complete");
    process.exit(1);
  }

  const sessions = await prisma.dateSession.findMany({
    where: { runId, status: { not: "completed" } },
    orderBy: { pairKey: "asc" },
  });
  console.log(`Completing ${sessions.length} dates for run ${runId}…`);
  let n = 0;
  for (const s of sessions) {
    await runDate(s.id);
    n += 1;
    if (n % 25 === 0) console.log(`  ${n}/${sessions.length}`);
  }
  await computeRankings(runId);

  const msgs = await prisma.dateMessage.count({ where: { dateSession: { runId } } });
  const ranks = await prisma.rankingEntry.count({ where: { runId } });
  const run = await prisma.showcaseRun.findUnique({ where: { id: runId } });
  console.log(
    `Done. status=${run?.status} completedPairs=${run?.completedPairs} messages=${msgs} rankingEntries=${ranks}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
