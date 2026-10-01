import PgBoss from "pg-boss";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { runExtractionAndAnalysis } from "@/services/analysis";
import { runDate, computeRankings } from "@/services/dates";

/**
 * Durable background worker (pg-boss, Postgres-backed). Queues:
 *   - analysis: extract sources + generate analysis for a participant
 *   - date:     run/resume one simulated date (idempotent)
 *   - ranking:  recompute rankings for a run
 * Concurrency is bounded by JOB_CONCURRENCY; pg-boss provides durability,
 * retries, and at-least-once delivery, and our handlers are idempotent.
 */

export const QUEUES = { analysis: "analysis", date: "date", ranking: "ranking" } as const;

async function main(): Promise<void> {
  if (!env.DATABASE_URL) {
    logger.error("worker requires DATABASE_URL");
    process.exit(1);
  }
  const boss = new PgBoss({ connectionString: env.DATABASE_URL, schema: env.JOB_SCHEMA });
  boss.on("error", (err) => logger.error("pg-boss error", { message: err.message }));
  await boss.start();

  const opts = { batchSize: env.JOB_CONCURRENCY };

  await boss.work<{ participantId: string }>(QUEUES.analysis, opts, async (jobs) => {
    for (const job of jobs) await runExtractionAndAnalysis(job.data.participantId);
  });
  await boss.work<{ dateSessionId: string }>(QUEUES.date, opts, async (jobs) => {
    for (const job of jobs) await runDate(job.data.dateSessionId);
  });
  await boss.work<{ runId: string }>(QUEUES.ranking, opts, async (jobs) => {
    for (const job of jobs) await computeRankings(job.data.runId);
  });

  logger.info("worker started", { concurrency: env.JOB_CONCURRENCY, schema: env.JOB_SCHEMA });
}

main().catch((err) => {
  logger.error("worker crashed", { message: (err as Error).message });
  process.exit(1);
});
