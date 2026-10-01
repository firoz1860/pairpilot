import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParticipant, getDatesForParticipant, getRankingFor } from "@/showcase";
import type { ShowcaseClaim, ShowcaseEvidence } from "@/showcase/types";
import { FictionBanner, SectionHeading, EvidenceChip } from "@/components/ui";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getParticipant(id);
  return { title: p ? `${p.displayName} · analysis` : "Participant" };
}

const CATEGORY_ORDER: ShowcaseClaim["category"][] = [
  "introduction",
  "professional_background",
  "hobby",
  "interest",
  "lifestyle_activity",
  "conversation_topic",
  "relationship_need",
];

function EvidenceRow({ ev }: { ev: ShowcaseEvidence }) {
  return (
    <li className="rounded-lg border border-line bg-ivory-deep/40 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-navy-soft">
        <span className="badge-unknown">{ev.platform}</span>
        <span>{titleCase(ev.kind)}</span>
        <span aria-hidden>·</span>
        <time dateTime={ev.extractedAt}>extracted {formatDate(ev.extractedAt)}</time>
        <EvidenceChip id={ev.stableId} />
      </div>
      <p className="mt-1 text-navy">“{ev.excerpt}”</p>
    </li>
  );
}

function ClaimCard({
  claim,
  evidence,
}: {
  claim: ShowcaseClaim;
  evidence: Map<string, ShowcaseEvidence>;
}) {
  const refs = claim.evidenceStableIds
    .map((id) => evidence.get(id))
    .filter((e): e is ShowcaseEvidence => Boolean(e));
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-navy-soft">
          {titleCase(claim.category)}
        </span>
        <div className="flex items-center gap-2">
          <span className={claim.disposition === "explicit" ? "badge-explicit" : "badge-unknown"}>
            {claim.disposition === "explicit" ? "explicit" : "interpretation"}
          </span>
          <span className="badge-unknown">confidence {Math.round(claim.confidence * 100)}%</span>
        </div>
      </div>
      <p className="mt-2 text-navy">{claim.text}</p>
      {claim.limitations ? (
        <p className="mt-1 text-xs text-navy-soft">Limitations: {claim.limitations}</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {refs.map((ev) => (
          <EvidenceRow key={ev.stableId} ev={ev} />
        ))}
      </ul>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParticipant(id);
  if (!p) notFound();

  const evidence = new Map(p.evidence.map((e) => [e.stableId, e]));
  const claimsByCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    claims: p.claims.filter((c) => c.category === cat),
  })).filter((g) => g.claims.length > 0);

  const dates = getDatesForParticipant(id);
  const ranking = getRankingFor(id);

  return (
    <div className="container-app py-10">
      <nav className="mb-4 text-sm text-navy-muted">
        <Link href="/showcase/participants" className="hover:text-navy">
          ← Directory
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">{p.displayName}</h1>
            <span className="badge-fiction">fictional</span>
          </div>
          <p className="mt-1 text-navy-muted">{p.headline}</p>
        </div>
        <div className="flex gap-2">
          {ranking ? (
            <Link href={`/showcase/participants/${id}/rankings`} className="btn-primary">
              View rankings
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <FictionBanner>
          <>
            <strong>Fictional profile.</strong> Built only from this persona&apos;s demo sources.
            Analysis v{p.analysis.version} · generated {formatDateTime(p.analysis.generatedAt)} ·
            model <code>{p.analysis.modelVersion}</code>.
          </>
        </FictionBanner>
      </div>

      {/* Sources */}
      <section className="mt-10">
        <SectionHeading title="Sources" subtitle="Exactly two per participant, read separately." />
        <div className="grid gap-4 sm:grid-cols-2">
          {p.sources.map((s) => (
            <div key={s.platform} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize text-navy">{s.platform}</span>
                <span
                  className={`badge ${
                    s.coverage === "full"
                      ? "bg-success/10 text-success"
                      : s.coverage === "partial"
                        ? "bg-warning/10 text-warning"
                        : "bg-danger/10 text-danger"
                  }`}
                >
                  {s.coverage} coverage
                </span>
              </div>
              <p className="mt-2 break-all font-mono text-xs text-navy-muted">{s.canonicalUrl}</p>
              <p className="mt-2 text-xs text-navy-soft">
                status: {s.status} · extracted {formatDate(s.extractedAt)}
              </p>
              {s.note ? <p className="mt-1 text-xs text-warning">{s.note}</p> : null}
            </div>
          ))}
        </div>
      </section>

      {/* Findings */}
      <section className="mt-10">
        <SectionHeading
          title="Source-backed findings"
          subtitle="Every finding cites an evidence excerpt, a timestamp, and whether it is explicit or interpreted."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {claimsByCategory.flatMap((g) =>
            g.claims.map((c) => <ClaimCard key={c.id} claim={c} evidence={evidence} />),
          )}
        </div>
      </section>

      {/* Unknowns */}
      <section className="mt-10">
        <SectionHeading title="Unknowns & missing evidence" />
        <div className="card p-5">
          <ul className="list-disc space-y-2 pl-5 text-sm text-navy-muted">
            {p.unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
            <li>
              <strong className="text-navy">Relationship needs:</strong> Not established from sources.
            </li>
          </ul>
        </div>
      </section>

      {/* Dates */}
      <section className="mt-10">
        <SectionHeading title={`Simulated dates (${dates.length})`} />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dates.slice(0, 9).map((d) => {
            const other = d.participantAId === id ? d.bName : d.aName;
            return (
              <li key={d.id}>
                <Link
                  href={`/showcase/dates/${d.id}`}
                  className="card block p-3 text-sm transition hover:border-coral/50"
                >
                  <span className="font-medium text-navy">vs {other}</span>
                  <span className="mt-1 block text-xs text-navy-soft">{d.messages.length} turns</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {dates.length > 9 ? (
          <p className="mt-2 text-xs text-navy-soft">
            Showing 9 of {dates.length}. Full set available via rankings.
          </p>
        ) : null}
      </section>
    </div>
  );
}
