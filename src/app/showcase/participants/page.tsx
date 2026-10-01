import type { Metadata } from "next";
import { getShowcase } from "@/showcase";
import { FictionBanner } from "@/components/ui";
import { DirectoryClient, type DirectoryItem } from "./DirectoryClient";

export const metadata: Metadata = { title: "Participant directory" };

export default function DirectoryPage() {
  const { participants } = getShowcase();

  const items: DirectoryItem[] = participants.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    headline: p.headline,
    city: p.city,
    profession: p.profession,
    interests: p.interests.map((i) => i.label),
    sources: p.sources.map((s) => ({
      platform: s.platform,
      status: s.status,
      coverage: s.coverage,
    })),
    ready: p.sources.some((s) => s.platform === "linkedin" && s.status === "complete"),
  }));

  const allInterests = Array.from(new Set(items.flatMap((i) => i.interests))).sort();

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold tracking-tight text-navy">Participant directory</h1>
      <p className="mt-2 max-w-2xl text-navy-muted">
        All {participants.length} showcase participants. Source availability, profile readiness, and
        consent eligibility are shown per participant. Search and filter by explicitly supported
        interests.
      </p>
      <div className="mt-6">
        <FictionBanner>
          <>
            <strong>Fictional directory.</strong> Every participant below is a clearly-labeled
            fictional persona in a completed simulation run. A real showcase would appear visibly
            distinct and is not present.
          </>
        </FictionBanner>
      </div>
      <div className="mt-6">
        <DirectoryClient participants={items} allInterests={allInterests} />
      </div>
    </div>
  );
}
