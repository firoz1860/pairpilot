import { getDate, getDateForPair } from "@/showcase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of a simulated date, turn by turn. Works with no
 * database (streams the deterministic showcase date). Supports reconnect: the
 * browser's `Last-Event-ID` header (or a `from` query param) resumes after the
 * last delivered turn, so pause/resume and dropped connections never replay or
 * duplicate turns.
 *
 *   GET /api/live-date?date=<dateId>[&from=<n>]
 *   GET /api/live-date?a=<participantId>&b=<participantId>[&from=<n>]
 */
const encoder = new TextEncoder();

function frame(event: string, data: unknown, id?: number): Uint8Array {
  const idLine = id != null ? `id: ${id}\n` : "";
  return encoder.encode(`${idLine}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const dateId = url.searchParams.get("date");
  const a = url.searchParams.get("a");
  const b = url.searchParams.get("b");
  const date = dateId ? getDate(dateId) : a && b ? getDateForPair(a, b) : undefined;
  if (!date) {
    return new Response("date not found", { status: 404 });
  }

  const lastEventId = req.headers.get("last-event-id");
  const fromParam = url.searchParams.get("from");
  let from = 0;
  if (lastEventId != null && lastEventId !== "") from = Number(lastEventId) + 1;
  else if (fromParam) from = Number(fromParam);
  if (!Number.isFinite(from) || from < 0) from = 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeEnqueue = (chunk: Uint8Array) => {
        try {
          controller.enqueue(chunk);
          return true;
        } catch {
          return false;
        }
      };
      safeEnqueue(
        frame("meta", {
          dateId: date.id,
          scenario: date.scenario,
          totalTurns: date.messages.length,
          aId: date.participantAId,
          bId: date.participantBId,
          aName: date.aName,
          bName: date.bName,
          resumingFrom: from,
        }),
      );
      for (const m of date.messages) {
        if (m.turnIndex < from) continue;
        if (req.signal.aborted) break;
        await delay(750);
        if (req.signal.aborted) break;
        if (!safeEnqueue(frame("turn", m, m.turnIndex))) break;
      }
      if (!req.signal.aborted) {
        safeEnqueue(frame("done", { total: date.messages.length }));
      }
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
