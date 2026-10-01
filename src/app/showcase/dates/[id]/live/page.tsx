import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDate } from "@/showcase";
import { FictionBanner } from "@/components/ui";
import { LiveRoom } from "./LiveRoom";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = getDate(id);
  return { title: d ? `Live: ${d.aName} × ${d.bName}` : "Live date room" };
}

export default async function LiveDatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const date = getDate(id);
  if (!date) notFound();

  return (
    <div className="container-app py-10">
      <nav className="mb-4 text-sm text-navy-muted">
        <Link href={`/showcase/dates/${id}`} className="hover:text-navy">
          ← Date summary &amp; evaluations
        </Link>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight text-navy">
        Live date room — {date.aName} <span className="text-navy-soft">×</span> {date.bName}
      </h1>
      <p className="mt-1 text-navy-muted">
        Agent messages stream in over Server-Sent Events, turn by turn. Pause, resume, and cancel are
        supported; resuming (or a dropped connection) reconnects from the last delivered turn.
      </p>
      <div className="my-6">
        <FictionBanner>
          <>
            <strong>Simulated live date.</strong> Two fictional agents exchanging generated messages —
            not a real human conversation. Messages are spoken by the <em>agent for</em> a participant.
          </>
        </FictionBanner>
      </div>
      <LiveRoom
        dateId={date.id}
        aId={date.participantAId}
        totalTurns={date.messages.length}
        scenario={date.scenario}
      />
    </div>
  );
}
