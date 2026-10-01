import type { ReactNode } from "react";

/** Prominent banner marking the showcase as a labeled fictional simulation. */
export function FictionBanner({ children }: { children?: ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-violet/30 bg-violet-soft px-4 py-3 text-sm text-navy"
    >
      <span aria-hidden className="mt-0.5 text-violet">
        ◆
      </span>
      <p>
        {children ?? (
          <>
            <strong>Fictional showcase.</strong> All participants are clearly-labeled fictional
            personas. No real person is profiled, and agent dialogue is a deterministic simulation —
            not a real human conversation.
          </>
        )}
      </p>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="text-3xl font-bold tabular-nums text-navy">{value}</div>
      <div className="mt-1 text-sm font-medium text-navy-muted">{label}</div>
      {hint ? <div className="mt-1 text-xs text-navy-soft">{hint}</div> : null}
    </div>
  );
}

/** Accessible 0–100 compatibility meter. Labeled as fit, never "love". */
export function ScoreMeter({ value, label = "Compatibility" }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div role="img" aria-label={`${label}: ${clamped} out of 100 (fit estimate)`} className="w-full">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-navy-muted">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-navy">{clamped}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ivory-deep">
        <div className="h-full rounded-full bg-coral" style={{ width: `${clamped}%` }} aria-hidden />
      </div>
    </div>
  );
}

export function UncertaintyBar({ value }: { value: number }) {
  const pctVal = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="img" aria-label={`Uncertainty: ${pctVal}%`} className="w-full">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-navy-muted">Uncertainty</span>
        <span className="text-sm font-semibold tabular-nums text-navy-muted">{pctVal}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ivory-deep">
        <div className="h-full rounded-full bg-violet/60" style={{ width: `${pctVal}%` }} aria-hidden />
      </div>
    </div>
  );
}

export function EvidenceChip({ id }: { id: string }) {
  return (
    <code className="rounded bg-ivory-deep px-1.5 py-0.5 font-mono text-[11px] text-navy-muted">
      {id}
    </code>
  );
}

export function SectionHeading({
  title,
  subtitle,
  id,
}: {
  title: string;
  subtitle?: string;
  id?: string;
}) {
  return (
    <div className="mb-4">
      <h2 id={id} className="text-xl font-bold text-navy">
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-navy-muted">{subtitle}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-base font-semibold text-navy">{title}</p>
      <p className="max-w-md text-sm text-navy-muted">{body}</p>
    </div>
  );
}
