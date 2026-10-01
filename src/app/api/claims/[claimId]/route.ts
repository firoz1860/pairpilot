import { NextResponse } from "next/server";
import { z } from "zod";
import { databaseReady } from "@/lib/env";
import { getCurrentParticipantId } from "@/lib/session";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { setClaimDecision, ClaimError } from "@/services/claims";

export const dynamic = "force-dynamic";

const BodySchema = z.object({ decision: z.enum(["approved", "rejected", "flagged"]) });

/** Approve / flag / reject one of the authenticated participant's own claims. */
export async function PATCH(req: Request, ctx: { params: Promise<{ claimId: string }> }) {
  const rl = checkRateLimit(clientKey(req.headers, "claims"));
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const participantId = await getCurrentParticipantId();
  if (!participantId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!databaseReady()) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });

  const { claimId } = await ctx.params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });

  try {
    await setClaimDecision(participantId, claimId, parsed.data.decision);
    return NextResponse.json({ ok: true, claimId, decision: parsed.data.decision });
  } catch (err) {
    if (err instanceof ClaimError) {
      return NextResponse.json(
        { error: err.code },
        { status: err.code === "forbidden" ? 403 : 404 },
      );
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
