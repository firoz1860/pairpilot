import Link from "next/link";
import type { Metadata } from "next";
import { getShowcase } from "@/showcase";
import { FictionBanner, Stat, ScoreMeter, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Showcase" };

export default function ShowcasePage() {
  const { meta, participants, dates, rankings } = getShowcase();
  const previewParticipants = participants.slice(0, 8);
  const sampleDates = dates.slice(0, 3);
  const sampleRanking = rankings[0];

  return (
    <div className="container-app py-10">
      <div className="flex flex-col gap-2">
        <span className="badge-fiction inline-flex w-fit">Completed fictional run</span>
        <h1 className="text-3xl font-bold tracking-tight text-navy">{meta.label}</h1>
        <p className="max-w-2xl text-navy-muted">
          A completed run you can explore without entering any links — profiles first, then date
          replays, then rankings. Compiled {formatDate(meta.generatedAt)} · rubric v
          {meta.rubricVersion} · model <code className="text-sm">{meta.modelVersion}</code>.
        </p>
      </div>

      <div className="mt-6">
        <FictionBanner />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Participants" value={meta.participantCount} hint="all fictional" />
        <Stat label="Completed pairs" value={meta.completedPairs} hint={`of ${meta.totalPairs}`} />
        <Stat label="Directional evals" value={meta.completedPairs * 2} />
        <Stat label="Rankings" value={rankings.length} hint="24 candidates each" />
      </div>

      {/* 1. Profiles first */}
      <section className="mt-12">
        <SectionHeading
          title="1 · Profiles"
          subtitle="Every profile is built only from cited source evidence."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {previewParticipants.map((p) => (
            <Link
              key={p.id}
              href={`/showcase/participants/${p.id}`}
              className="card p-4 transition hover:border-coral/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy">{p.displayName}</span>
                <span className="badge-fiction">fiction</span>
              </div>
              <p className="mt-1 text-sm text-navy-muted">{p.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.interests.slice(0, 3).map((i) => (
                  <span key={i.label} className="badge-unknown">
                    {i.label}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/showcase/participants" className="btn-secondary">
            Open full directory ({participants.length}) →
          </Link>
        </div>
      </section>

      {/* 2. Date replays */}
      <section className="mt-12">
        <SectionHeading
          title="2 · Date replays"
          subtitle="Each date is a staged, persisted, simulated conversation."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {sampleDates.map((d) => (
            <Link
              key={d.id}
              href={`/showcase/dates/${d.id}`}
              className="card p-4 transition hover:border-coral/50 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-navy">
                {d.aName} <span className="text-navy-soft">×</span> {d.bName}
              </p>
              <p className="mt-1 text-xs text-navy-muted">Scenario: {d.scenario}</p>
              <p className="mt-2 text-xs text-navy-soft">
                {d.messages.length} turns · {d.evaluations.length} directional evaluations
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Rankings */}
      {sampleRanking ? (
        <section className="mt-12">
          <SectionHeading
            title="3 · Rankings"
            subtitle={`Explainable compatibility ranking — e.g. for ${sampleRanking.forName}.`}
          />
          <div className="card divide-y divide-line">
            {sampleRanking.entries.slice(0, 5).map((e) => (
              <div key={e.candidateId} className="flex items-center gap-4 p-4">
                <span className="w-6 text-center text-sm font-bold text-navy-soft">{e.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy">{e.candidateName}</p>
                  <p className="truncate text-xs text-navy-muted">
                    {e.strongestSharedInterests.length > 0
                      ? `Shared: ${e.strongestSharedInterests.join(", ")}`
                      : "Complementary interests only"}
                  </p>
                </div>
                <div className="w-40 shrink-0">
                  <ScoreMeter value={e.compatibility} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href={`/showcase/participants/${sampleRanking.forParticipantId}/rankings`}
              className="btn-secondary"
            >
              See all 24 ranked for {sampleRanking.forName} →
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
