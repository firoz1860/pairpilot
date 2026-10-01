"use client";

import { useState } from "react";
import { EvidenceChip } from "@/components/ui";
import { titleCase } from "@/lib/format";

export interface DbClaim {
  id: string;
  category: string;
  text: string;
  disposition: string;
  approvalStatus: "pending" | "approved" | "rejected" | "flagged";
  evidenceStableIds: string[];
}

type Decision = "approved" | "rejected" | "flagged";

/**
 * Authenticated agent studio wired to database-backed claims. Each decision is
 * persisted via PATCH /api/claims/[id] (ownership-enforced server-side); the UI
 * reflects the server's confirmed state, not just a local toggle.
 */
export function StudioClient({ claims: initial }: { claims: DbClaim[] }) {
  const [claims, setClaims] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  async function decide(id: string, decision: Decision) {
    setSaving(id);
    setErr("");
    try {
      const res = await fetch(`/api/claims/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setClaims((cs) => cs.map((c) => (c.id === id ? { ...c, approvalStatus: decision } : c)));
      } else if (res.status === 401) {
        setErr("Your session expired — please log in again.");
      } else if (res.status === 403) {
        setErr("You can only edit your own claims.");
      } else {
        setErr("Could not save that decision.");
      }
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(null);
    }
  }

  if (claims.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-bold text-navy">Your sources are being processed</h2>
        <p className="mt-2 text-sm text-navy-muted">
          No analysed claims yet. Extraction + analysis run as a background job; once the worker has read
          your two sources, your evidence-backed claims appear here for review. (Reload after processing.)
        </p>
      </div>
    );
  }

  return (
    <div>
      {err ? (
        <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {err}
        </p>
      ) : null}
      <ul className="space-y-3">
        {claims.map((c) => (
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
                  <span className="badge-unknown">saved: {c.approvalStatus}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1" role="group" aria-label={`Decision for ${c.text}`}>
                {(["approved", "flagged", "rejected"] as Decision[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={saving === c.id}
                    aria-pressed={c.approvalStatus === opt}
                    onClick={() => decide(c.id, opt)}
                    className={`badge ${
                      c.approvalStatus === opt
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
        ))}
      </ul>
    </div>
  );
}
