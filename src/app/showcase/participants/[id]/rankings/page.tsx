import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParticipant, getRankingFor, getDate } from "@/showcase";
import { FictionBanner, SectionHeading, ScoreMeter, UncertaintyBar } from "@/components/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getParticipant(id);
  return { title: p ? `${p.displayName} · rankings` : "Rankings" };
}

const DIMENSION_LABELS: Record<string, string> = {
  sharedExplicitInterests: "Shared interests",
  conversationQuality: "Conversation quality",
  scenarioAgreement: "Scenario agreement",
  complementaryInterests: "Complementary interests",
};

export default async function RankingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParticipant(id);
  const ranking = getRankingFor(id);
  if (!p || !ranking) notFound();

  return (
    <div className="container-app py-10">
      <nav className="mb-4 text-sm text-navy-muted">
        <Link href={`/showcase/participants/${id}`} className="hover:text-navy">
          ← {p.displayName}&apos;s profile
        </Link>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-navy">Rankings for {p.displayName}</h1>
      <p className="mt-2 max-w-2xl text-navy-muted">
        {ranking.entries.length} candidates ranked by explainable fit. Compatibility reflects
        conversational and interest fit — not a probability of love. Missing information raises
        uncertainty rather than lowering the score.
      </p>

      <div className="mt-6">
        <FictionBanner />
      </div>

      {ranking.provisional ? (
        <p className="mt-4 rounded-lg bg-warning/10 px-4 py-2 text-sm text-warning">
          Provisional — the run has not finished; ranks may change.
        </p>
      ) : null}

      <div className="mt-6">
        <SectionHeading title={`Ranked candidates (${ranking.entries.length})`} />
        <ol className="space-y-4">
          {ranking.entries.map((e) => {
            const date = getDate(e.dateId);
            const evaluation = date?.evaluations.find((ev) => ev.fromId === id);
            return (
              <li key={e.candidateId} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                      {e.rank}
                    </span>
                    <div>
                      <Link
                        href={`/showcase/participants/${e.candidateId}`}
                        className="font-semibold text-navy hover:text-coral-dark"
                      >
                        {e.candidateName}
                      </Link>
                      <p className="text-xs text-navy-soft">
                        {e.strongestSharedInterests.length > 0
                          ? `Shared: ${e.strongestSharedInterests.join(", ")}`
                          : "No explicit shared interest — complementary fit"}
                      </p>
                    </div>
                  </div>
                  <div className="w-full max-w-xs space-y-2">
                    <ScoreMeter value={e.compatibility} />
                    <UncertaintyBar value={e.uncertainty} />
                  </div>
                </div>

                {evaluation ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                      <p className="text-sm text-navy">{evaluation.explanation}</p>
                      {evaluation.importantMissingInformation.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 text-xs text-navy-soft">
                          {evaluation.importantMissingInformation.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-navy-muted">
                        <Link href={`/showcase/dates/${e.dateId}`} className="btn-ghost px-2 py-1">
                          Open transcript →
                        </Link>
                        <span className="self-center">
                          cites turns {evaluation.citedTurnIndexes.join(", ")} ·{" "}
                          {evaluation.citedEvidenceIds.length} evidence refs
                        </span>
                      </div>
                    </div>
                    <dl className="space-y-1.5">
                      {Object.entries(evaluation.dimensions).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-2 text-xs">
                          <dt className="text-navy-muted">{DIMENSION_LABELS[k] ?? k}</dt>
                          <dd className="w-28">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory-deep">
                              <div
                                className="h-full rounded-full bg-violet"
                                style={{ width: `${Math.round(v * 100)}%` }}
                              />
                            </div>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
