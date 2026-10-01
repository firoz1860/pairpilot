"use client";

import { useEffect, useRef, useState } from "react";
import type { ShowcaseDate } from "@/showcase/types";
import { titleCase } from "@/lib/format";

const STAGE_STYLE: Record<string, string> = {
  introduction: "bg-violet-soft text-violet",
  shared_interests: "bg-coral-soft text-coral-dark",
  practical_scenario: "bg-success/10 text-success",
  reflection: "bg-ivory-deep text-navy-muted",
};

export function DateReplay({ date }: { date: ShowcaseDate }) {
  const total = date.messages.length;
  const [shown, setShown] = useState(total); // start fully revealed; replay re-streams
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      setShown((n) => {
        if (n >= total) {
          setPlaying(false);
          return n;
        }
        return n + 1;
      });
    }, 900);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, total]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [shown]);

  function replay() {
    setShown(0);
    setPlaying(true);
  }

  const visible = date.messages.slice(0, shown);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Replay controls">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="btn-primary"
          disabled={shown >= total && !playing}
        >
          {playing ? "Pause" : shown >= total ? "Replayed" : "Resume"}
        </button>
        <button type="button" onClick={replay} className="btn-secondary">
          Replay from start
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setShown(total);
          }}
          className="btn-ghost"
        >
          Show all
        </button>
        <span className="ml-auto text-sm text-navy-soft" aria-live="polite">
          turn {Math.min(shown, total)} / {total}
        </span>
      </div>

      <ol className="mt-5 space-y-3">
        {visible.map((m) => {
          const isA = m.speakerId === date.participantAId;
          return (
            <li key={m.turnIndex} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl border border-line p-3 ${
                  isA ? "bg-surface" : "bg-coral-soft/40"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-navy">{m.speakerName}&apos;s agent</span>
                  <span className={`badge ${STAGE_STYLE[m.stage] ?? "badge-unknown"}`}>
                    {titleCase(m.stage)}
                  </span>
                  <span className="text-navy-soft">turn {m.turnIndex + 1}</span>
                </div>
                <p className="text-sm text-navy">{m.content}</p>
                {m.citedEvidenceIds.length > 0 ? (
                  <p className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-navy-soft">
                    {m.citedEvidenceIds.map((id) => (
                      <code key={id} className="rounded bg-ivory-deep px-1.5 py-0.5 font-mono">
                        {id}
                      </code>
                    ))}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>
    </div>
  );
}
