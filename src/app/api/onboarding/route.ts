import { NextResponse } from "next/server";
import { databaseReady } from "@/lib/env";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { setSession } from "@/lib/session";
import { UrlValidationError } from "@/domain/url";
import { OnboardingInputSchema, OnboardingError, onboardParticipant } from "@/services/onboarding";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = checkRateLimit(clientKey(req.headers, "onboarding"));
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = OnboardingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }

  if (!databaseReady()) {
    return NextResponse.json(
      {
        error: "database_unavailable",
        message:
          "Onboarding requires a configured PostgreSQL database (DATABASE_URL). The public showcase needs no database.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await onboardParticipant(parsed.data);
    await setSession(result.participantId);
    return NextResponse.json(
      { participantId: result.participantId, status: "onboarding" },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof UrlValidationError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 });
    }
    if (err instanceof OnboardingError) {
      const status = err.code === "email_taken" ? 409 : 400;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    logger.error("onboarding failed", { message: (err as Error)?.message });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
