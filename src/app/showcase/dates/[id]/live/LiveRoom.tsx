"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { titleCase } from "@/lib/format";

interface LiveMessage {
  turnIndex: number;
  stage: string;
  speakerId: string;
  speakerName: string;
  content: string;
  citedEvidenceIds: string[];
}

type Status = "idle" | "streaming" | "paused" | "reconnecting" | "done" | "cancelled";

const STAGE_STYLE: Record<string, string> = {
  introduction: "bg-violet-soft text-violet",
  shared_interests: "bg-coral-soft text-coral-dark",
  practical_scenario: "bg-success/10 text-success",
  reflection: "bg-ivory-deep text-navy-muted",
};

export function LiveRoom({
  dateId,
  aId,
  totalTurns,
  scenario,
}: {
  dateId: string;
  aId: string;
  totalTurns: number;
  scenario: string;
}) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const nextFrom = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const startedAt = useRef<number | null>(null);

  const closeStream = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const open = useCallback(() => {
    closeStream();
    setStatus("streaming");
    if (startedAt.current == null) startedAt.current = Date.now();
    const es = new EventSource(`/api/live-date?date=${encodeURIComponent(dateId)}&from=${nextFrom.current}`);
    esRef.current = es;

    es.addEventListener("turn", (e) => {
      const m = JSON.parse((e as MessageEvent).data) as LiveMessage;
      nextFrom.current = m.turnIndex + 1;
      setMessages((prev) => (prev.some((p) => p.turnIndex === m.turnIndex) ? prev : [...prev, m]));
    });
    es.addEventListener("done", () => {
      closeStream();
      setStatus("done");
    });
    es.onerror = () => {
      // Connection dropped mid-stream: the browser will auto-reconnect with
      // Last-Event-ID. Reflect that unless we've already finished.
      setStatus((s) => (s === "done" || s === "paused" || s === "cancelled" ? s : "reconnecting"));
    };
  }, [closeStream, dateId]);

  useEffect(() => {
    if (status !== "streaming" && status !== "reconnecting") return;
    const t = setInterval(() => {
      if (startedAt.current != null) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useEffect(() => () => closeStream(), [closeStream]);

  function pause() {
    closeStream();
    setStatus("paused");
  }
  function cancel() {
    closeStream();
    setStatus("cancelled");
  }
  function restart() {
    closeStream();
    setMessages([]);
    nextFrom.current = 0;
    startedAt.current = null;
    setElapsed(0);
    open();
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const currentStage = messages.at(-1)?.stage;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3">
        <div className="flex gap-2">
          {status === "idle" || status === "cancelled" ? (
            <button type="button" className="btn-primary" onClick={restart}>
              Start date
            </button>
          ) : null}
          {status === "streaming" || status === "reconnecting" ? (
            <button type="button" className="btn-secondary" onClick={pause}>
              Pause
            </button>
          ) : null}
          {status === "paused" ? (
            <button type="button" className="btn-primary" onClick={open}>
              Resume
            </button>
          ) : null}
          {status !== "idle" && status !== "cancelled" ? (
            <button type="button" className="btn-ghost" onClick={cancel}>
              Cancel
            </button>
          ) : null}
          {status === "done" ? (
            <button type="button" className="btn-secondary" onClick={restart}>
              Replay
            </button>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm text-navy-muted" aria-live="polite">
          <span>
            round {Math.min(messages.length, totalTurns)}/{totalTurns}
          </span>
          {currentStage ? <span className="badge-unknown">{titleCase(currentStage)}</span> : null}
          <span className="tabular-nums">
            {mm}:{ss}
          </span>
          <span
            className={
              status === "streaming"
                ? "text-success"
                : status === "reconnecting"
                  ? "text-warning"
                  : "text-navy-soft"
            }
          >
            {status}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-navy-soft">Scenario: {scenario}</p>

      <ol className="mt-4 space-y-3">
        {messages.map((m) => {
          const isA = m.speakerId === aId;
          return (
            <li key={m.turnIndex} className={`flex ${isA ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl border border-line p-3 ${isA ? "bg-surface" : "bg-coral-soft/40"}`}
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

      {status === "idle" ? (
        <p className="mt-4 text-sm text-navy-muted">
          Press <strong>Start date</strong> to stream the agent conversation live over SSE. Pause and
          resume reconnect from the last delivered turn — no turn is replayed or duplicated.
        </p>
      ) : null}
    </div>
  );
}
