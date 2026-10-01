import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDate } from "@/showcase";
import type { ShowcaseEvaluation } from "@/showcase/types";
import { FictionBanner, SectionHeading, ScoreMeter, UncertaintyBar } from "@/components/ui";
import { DateReplay } from "./DateReplay";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = getDate(id);
  return { title: d ? `${d.aName} × ${d.bName} · date` : "Date" };
}

const DIMENSION_LABELS: Record<string, string> = {
  sharedExplicitInterests: "Shared interests",
  conversationQuality: "Conversation quality",
  scenarioAgreement: "Scenario agreement",
  complementaryInterests: "Complementary interests",
};

function EvaluationCard({
  evaluation,
  fromName,
  toName,
}: {
  evaluation: ShowcaseEvaluation;
  fromName: string;
  toName: string;
}) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-navy">
        {fromName}&apos;s agent → {toName}
      </h3>
      <p className="mt-0.5 text-xs text-navy-soft">
        Simulated evaluation · rubric v{evaluation.rubricVersion} · {evaluation.modelVersion}
      </p>
      <div className="mt-3 space-y-2">
        <ScoreMeter value={evaluation.compatibility} />
        <UncertaintyBar value={evaluation.uncertainty} />
      </div>
      <dl className="mt-3 space-y-1.5">
        {Object.entries(evaluation.dimensions).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 text-xs">
            <dt className="text-navy-muted">{DIMENSION_LABELS[k] ?? k}</dt>
            <dd className="flex w-32 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ivory-deep">
                <div className="h-full rounded-full bg-violet" style={{ width: `${Math.round(v * 100)}%` }} />
              </div>
              <span className="w-8 text-right tabular-nums text-navy-soft">{Math.round(v * 100)}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-navy">{evaluation.explanation}</p>
      <p className="mt-2 text-xs text-navy-soft">
        Cites turns {evaluation.citedTurnIndexes.map((t) => t + 1).join(", ")} ·{" "}
        {evaluation.citedEvidenceIds.length} evidence references
      </p>
    </div>
  );
}

export default async function DatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const date = getDate(id);
  if (!date) notFound();

  const [ab, ba] = date.evaluations;

  return (
    <div className="container-app py-10">
      <nav className="mb-4 text-sm text-navy-muted">
        <Link href="/showcase" className="hover:text-navy">
          ← Showcase
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            <Link href={`/showcase/participants/${date.participantAId}`} className="hover:text-coral-dark">
              {date.aName}
            </Link>{" "}
            <span className="text-navy-soft">×</span>{" "}
            <Link href={`/showcase/participants/${date.participantBId}`} className="hover:text-coral-dark">
              {date.bName}
            </Link>
          </h1>
          <p className="mt-1 text-navy-muted">
            Scenario: {date.scenario} · {date.messages.length} turns · 4 stages
          </p>
        </div>
      </div>

      <div className="mt-6">
        <FictionBanner>
          <>
            <strong>Simulated date.</strong> This is a deterministic agent conversation between two
            fictional personas — not a real human date. Each message is spoken by the <em>agent for</em>{" "}
            a participant.
          </>
        </FictionBanner>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading title="Transcript" subtitle="Press play to re-stream the conversation turn by turn." />
          <Link href={`/showcase/dates/${date.id}/live`} className="btn-secondary">
            ▶ Open live room (SSE)
          </Link>
        </div>
        <DateReplay date={date} />
      </section>

      <section className="mt-10">
        <SectionHeading
          title="Directional evaluations"
          subtitle="A separate evaluator scores each direction and cites transcript turns + evidence."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {ab ? <EvaluationCard evaluation={ab} fromName={date.aName} toName={date.bName} /> : null}
          {ba ? <EvaluationCard evaluation={ba} fromName={date.bName} toName={date.aName} /> : null}
        </div>
      </section>
    </div>
  );
}
