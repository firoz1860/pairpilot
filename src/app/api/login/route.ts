import { NextResponse } from "next/server";
import { z } from "zod";
import { databaseReady } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { setSession } from "@/lib/session";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const rl = checkRateLimit(clientKey(req.headers, "login"));
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  if (!databaseReady()) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });

  const participant = await prisma.participant.findUnique({ where: { email: parsed.data.email } });
  if (!participant || !(await verifyPassword(parsed.data.password, participant.passwordHash))) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  await setSession(participant.id);
  return NextResponse.json({ id: participant.id, displayName: participant.displayName });
}
