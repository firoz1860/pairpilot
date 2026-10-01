import { NextResponse } from "next/server";
import { databaseReady } from "@/lib/env";
import { getCurrentParticipantId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** The currently authenticated participant, or 401. */
export async function GET() {
  const participantId = await getCurrentParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!databaseReady()) {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, displayName: true, status: true },
  });
  if (!participant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(participant);
}
