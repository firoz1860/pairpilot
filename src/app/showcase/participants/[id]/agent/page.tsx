import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getParticipant } from "@/showcase";
import { FictionBanner } from "@/components/ui";
import { AgentStudio, type StudioClaim } from "./AgentStudio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getParticipant(id);
  return { title: p ? `${p.displayName} · agent studio` : "Agent studio" };
}

export default async function AgentStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParticipant(id);
  if (!p) notFound();

  const claims: StudioClaim[] = p.claims.map((c) => ({
    id: c.id,
    category: c.category,
    text: c.text,
    disposition: c.disposition,
    confidence: c.confidence,
    evidenceStableIds: c.evidenceStableIds,
  }));

  return (
    <div className="container-app py-10">
      <nav className="mb-4 text-sm text-navy-muted">
        <Link href={`/showcase/participants/${id}`} className="hover:text-navy">
          ← {p.displayName}&apos;s profile
        </Link>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight text-navy">Agent studio — {p.displayName}</h1>
      <p className="mt-2 max-w-2xl text-navy-muted">
        Review the agent&apos;s grounded persona and the claims it may use. Approve, flag, or reject each
        extracted claim before the agent enters the simulation.
      </p>
      <div className="my-6">
        <FictionBanner />
      </div>
      <AgentStudio claims={claims} displayName={p.displayName} />
    </div>
  );
}
