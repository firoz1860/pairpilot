"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";

export interface DirectoryItem {
  id: string;
  displayName: string;
  headline: string;
  city: string;
  profession: string;
  interests: string[];
  sources: { platform: string; status: string; coverage: string }[];
  ready: boolean;
}

export function DirectoryClient({
  participants,
  allInterests,
}: {
  participants: DirectoryItem[];
  allInterests: string[];
}) {
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return participants.filter((p) => {
      const matchesQuery =
        !q ||
        p.displayName.toLowerCase().includes(q) ||
        p.profession.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q);
      const matchesInterest = !interest || p.interests.includes(interest);
      return matchesQuery && matchesInterest;
    });
  }, [participants, query, interest]);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <label htmlFor="dir-search" className="sr-only">
          Search participants
        </label>
        <input
          id="dir-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, profession, or city…"
          className="input"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by interest">
          <button
            type="button"
            onClick={() => setInterest(null)}
            aria-pressed={interest === null}
            className={`badge ${interest === null ? "bg-coral text-white" : "border border-line bg-surface text-navy-muted"}`}
          >
            All interests
          </button>
          {allInterests.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInterest(i === interest ? null : i)}
              aria-pressed={interest === i}
              className={`badge ${interest === i ? "bg-coral text-white" : "border border-line bg-surface text-navy-muted hover:bg-ivory-deep"}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-navy-muted" aria-live="polite">
        {results.length} of {participants.length} participants
      </p>

      {results.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No participants match"
            body="Try a different search term or clear the interest filter."
          />
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={`/showcase/participants/${p.id}`}
                className="card flex h-full flex-col p-4 transition hover:border-coral/50 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-navy">{p.displayName}</span>
                  <span className="badge-fiction">fiction</span>
                </div>
                <p className="mt-1 text-sm text-navy-muted">{p.headline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.interests.map((i) => (
                    <span key={i} className="badge-unknown">
                      {i}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-navy-soft">
                  {p.sources.map((s) => (
                    <span key={s.platform} className="inline-flex items-center gap-1">
                      <span
                        aria-hidden
                        className={`h-2 w-2 rounded-full ${
                          s.coverage === "full"
                            ? "bg-success"
                            : s.coverage === "partial"
                              ? "bg-warning"
                              : "bg-danger"
                        }`}
                      />
                      {s.platform} ({s.coverage})
                    </span>
                  ))}
                  <span className={p.ready ? "text-success" : "text-warning"}>
                    {p.ready ? "profile ready" : "incomplete"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
