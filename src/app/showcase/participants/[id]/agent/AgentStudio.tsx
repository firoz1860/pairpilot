"use client";

import { useState } from "react";
import { EvidenceChip } from "@/components/ui";
import { titleCase } from "@/lib/format";

export interface StudioClaim {
  id: string;
  category: string;
  text: string;
  disposition: string;
  confidence: number;
  evidenceStableIds: string[];
}

type Decision = "approved" | "rejected" | "flagged";

/**
 * Read-only review demo of the agent studio. In the DB-backed app, approving or
 * rejecting a claim persists (auth + ownership required) and reshapes the agent;
 * here the toggles are local and labeled, since the showcase has no database.
 */
export function AgentStudio({ claims, displayName }: { claims: StudioClaim[]; displayName: string }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>(
    Object.fromEntries(claims.map((c) => [c.id, "approved" as Decision])),
  );

  const approved = claims.filter((c) => decisions[c.id] === "approved");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="mb-3 text-sm text-navy-muted">
          Approve or reject extracted claims. Corrections can only remove or flag a claim — they never
          add new biographical sources. (In this showcase the toggles are a local review demo.)
        </p>
        <ul className="space-y-3">
          {claims.map((c) => {
            const d = decisions[c.id] ?? "approved";
            return (
              <li key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-navy-soft">
                      {titleCase(c.category)}
                    </span>
                    <p className="mt-1 text-navy">{c.text}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-navy-soft">
                      <span className={c.disposition === "explicit" ? "badge-explicit" : "badge-unknown"}>
                        {c.disposition === "explicit" ? "explicit" : "interpretation"}
                      </span>
                      {c.evidenceStableIds.map((id) => (
                        <EvidenceChip key={id} id={id} />
                      ))}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1" role="group" aria-label={`Decision for ${c.text}`}>
                    {(["approved", "flagged", "rejected"] as Decision[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={d === opt}
                        onClick={() => setDecisions((prev) => ({ ...prev, [c.id]: opt }))}
                        className={`badge ${
                          d === opt
                            ? opt === "rejected"
                              ? "bg-danger text-white"
                              : opt === "flagged"
                                ? "bg-warning text-white"
                                : "bg-success text-white"
                            : "border border-line bg-surface text-navy-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <h2 className="text-base font-bold text-navy">Grounded persona</h2>
          <p className="mt-2 text-sm text-navy-muted">
            {displayName}&apos;s agent speaks only from approved, source-backed claims and acknowledges
            unknowns. It is a labeled simulation and never impersonates {displayName}.
          </p>
          <h3 className="mt-4 text-sm font-semibold text-navy">Conversation rules</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-navy-muted">
            <li>Discuss only source-backed interests.</li>
            <li>Acknowledge unknowns; never invent memories or preferences.</li>
            <li>Relationship needs: not established from sources.</li>
            <li>Allow respectful disagreement; avoid generic agreement.</li>
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-navy">Readiness</h3>
          <p className="mt-1 text-sm text-navy-muted">
            {approved.length} of {claims.length} claims approved.
          </p>
          <p
            className={`mt-2 text-sm font-medium ${approved.length > 0 ? "text-success" : "text-warning"}`}
          >
            {approved.length > 0 ? "Ready to enter the simulation." : "Approve at least one claim to proceed."}
          </p>
        </div>
      </aside>
    </div>
  );
}
