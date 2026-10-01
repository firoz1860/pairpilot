import type { Metadata } from "next";
import { env, llmReady, liveSourceReady, databaseReady, allowedSourceHosts } from "@/lib/env";
import { getShowcase } from "@/showcase";
import { Stat, SectionHeading } from "@/components/ui";

export const metadata: Metadata = { title: "Integration & run status" };

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean | "warn";
  detail: string;
}) {
  const color = ok === true ? "bg-success" : ok === "warn" ? "bg-warning" : "bg-danger";
  const text = ok === true ? "Ready" : ok === "warn" ? "Fixture / limited" : "Not configured";
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <div>
        <p className="font-medium text-navy">{label}</p>
        <p className="text-sm text-navy-muted">{detail}</p>
      </div>
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-navy">
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {text}
      </span>
    </div>
  );
}

export default function StatusPage() {
  const { meta } = getShowcase();

  const llmStatus: boolean | "warn" = env.LLM_PROVIDER === "fixture" ? "warn" : llmReady();
  const sourceStatus: boolean | "warn" = env.SOURCE_PROVIDER === "fixture" ? "warn" : liveSourceReady();

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold tracking-tight text-navy">Integration &amp; run status</h1>
      <p className="mt-2 max-w-2xl text-navy-muted">
        Live configuration and the completed run&apos;s statistics. No credentials or personal
        administrative records are shown.
      </p>

      <section className="mt-8">
        <SectionHeading title="Providers" />
        <div className="card px-5 py-1">
          <StatusRow
            label="LLM provider"
            ok={llmStatus}
            detail={
              env.LLM_PROVIDER === "fixture"
                ? `Fixture mode — deterministic simulation dialogue, no key required (model label: ${env.ANTHROPIC_MODEL}).`
                : llmReady()
                  ? `Anthropic configured (model: ${env.ANTHROPIC_MODEL}).`
                  : "Anthropic selected but ANTHROPIC_API_KEY is missing — agent runs will fail loudly rather than fabricate."
            }
          />
          <StatusRow
            label="Source extraction"
            ok={sourceStatus}
            detail={
              env.SOURCE_PROVIDER === "fixture"
                ? "Fixture mode — bundled fictional source documents. No scraping is performed."
                : liveSourceReady()
                  ? "Authorized live extraction provider configured."
                  : "Live selected but provider base URL / key missing — live extraction is disabled."
            }
          />
          <StatusRow
            label="Database (PostgreSQL)"
            ok={databaseReady()}
            detail={
              databaseReady()
                ? "DATABASE_URL configured — interactive onboarding, live dates, and durable jobs are available."
                : "DATABASE_URL not set — the DB-backed interactive flows require it. The showcase below needs no database."
            }
          />
          <StatusRow
            label="Background jobs (pg-boss)"
            ok={databaseReady() ? true : false}
            detail={
              databaseReady()
                ? `Queue schema "${env.JOB_SCHEMA}", concurrency ${env.JOB_CONCURRENCY}. Durable + idempotent + resumable.`
                : "Requires a database. Jobs: extraction, analysis, dates, evaluation, ranking."
            }
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading title="Outbound safety (SSRF)" />
        <div className="card p-5 text-sm text-navy-muted">
          <p>
            Allowed extraction hosts:{" "}
            {allowedSourceHosts.map((h) => (
              <code key={h} className="mr-1 rounded bg-ivory-deep px-1.5 py-0.5 font-mono text-xs">
                {h}
              </code>
            ))}
          </p>
          <p className="mt-2">
            Private, loopback, link-local, CGNAT, and cloud-metadata ranges are blocked; redirects are
            revalidated; timeout {env.SOURCE_HTTP_TIMEOUT_MS}ms; up to {env.SOURCE_MAX_RETRIES} retries.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading title="Completed run" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Participants" value={meta.participantCount} hint="fictional" />
          <Stat label="Pairs run" value={`${meta.completedPairs}/${meta.totalPairs}`} />
          <Stat label="Est. cost" value="$0.00" hint="fixture mode" />
          <Stat label="Failed jobs" value={0} hint="deterministic" />
        </div>
        <p className="mt-3 text-xs text-navy-soft">
          Run compiled {meta.generatedAt} · rubric v{meta.rubricVersion} · model {meta.modelVersion}.
        </p>
      </section>
    </div>
  );
}
