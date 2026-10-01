import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentParticipantId } from "@/lib/session";
import { databaseReady } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { FictionBanner } from "@/components/ui";
import { StudioClient, type DbClaim } from "./StudioClient";

export const metadata: Metadata = { title: "Agent studio" };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  if (!databaseReady()) {
    return (
      <div className="container-app py-10">
        <h1 className="text-3xl font-bold text-navy">Agent studio</h1>
        <p className="mt-2 text-navy-muted">
          This authenticated studio requires a configured database. See{" "}
          <Link href="/status" className="text-coral-dark underline">
            /status
          </Link>
          .
        </p>
      </div>
    );
  }

  const participantId = await getCurrentParticipantId();
  if (!participantId) redirect("/login");

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { analyses: { orderBy: { version: "desc" }, take: 1, include: { claims: true } } },
  });
  if (!participant) redirect("/login");

  const claims: DbClaim[] = (participant.analyses[0]?.claims ?? []).map((c) => ({
    id: c.id,
    category: c.category,
    text: c.text,
    disposition: c.disposition,
    approvalStatus: c.approvalStatus,
    evidenceStableIds: c.evidenceStableIds,
  }));

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold tracking-tight text-navy">
        Agent studio — {participant.displayName}
      </h1>
      <p className="mt-2 max-w-2xl text-navy-muted">
        Review the claims extracted from your two sources and approve, flag, or reject each. Decisions are
        saved to your account (ownership-enforced) and shape the agent that enters the simulation.
      </p>
      <div className="my-6">
        <FictionBanner>
          <>
            <strong>Your account.</strong> These claims come only from your own sources. Relationship needs
            are never inferred; corrections can remove or flag a claim but never add new sources.
          </>
        </FictionBanner>
      </div>
      <StudioClient claims={claims} />
    </div>
  );
}
