import PgBoss from "pg-boss";
import { env } from "./env";

/**
 * pg-boss producer helpers. A single boss instance is lazily started and
 * reused. Queues are created idempotently (pg-boss v10 requires explicit
 * queue creation before send). Enqueuing is best-effort at call sites: if the
 * queue is unavailable, callers log and continue rather than failing the
 * user-facing request.
 */
export const QUEUES = { analysis: "analysis", date: "date", ranking: "ranking" } as const;

let bossPromise: Promise<PgBoss> | null = null;

async function getBoss(): Promise<PgBoss> {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required to enqueue jobs");
  if (!bossPromise) {
    // Drop `sslmode` from the URL so pg does not force full CA verification;
    // TLS is still enabled via the explicit `ssl` option. Managed poolers
    // (Supabase/Neon) present certs that fail full verification.
    const connUrl = new URL(env.DATABASE_URL);
    connUrl.searchParams.delete("sslmode");
    const isLocal = ["localhost", "127.0.0.1"].includes(connUrl.hostname);
    const boss = new PgBoss({
      connectionString: connUrl.toString(),
      schema: env.JOB_SCHEMA,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
    bossPromise = boss.start().then(async () => {
      for (const q of Object.values(QUEUES)) await boss.createQueue(q);
      return boss;
    });
  }
  return bossPromise;
}

export async function enqueueAnalysis(participantId: string): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(QUEUES.analysis, { participantId });
}

export async function enqueueRanking(runId: string): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(QUEUES.ranking, { runId });
}

export async function enqueueDate(dateSessionId: string): Promise<string | null> {
  const boss = await getBoss();
  return boss.send(QUEUES.date, { dateSessionId });
}
