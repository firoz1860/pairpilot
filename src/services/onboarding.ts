import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { normalizeProfileUrl } from "@/domain/url";

/**
 * Onboarding service. Validates the two source URLs, requires adult eligibility
 * + dating-simulation consent + identity confirmation, and creates the
 * participant, consent record, and two source profiles in one transaction.
 * Public availability is never treated as consent.
 */

export const OnboardingInputSchema = z.object({
  displayName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  linkedinUrl: z.string().min(1),
  instagramUrl: z.string().min(1),
  adultConfirmed: z.literal(true),
  consentDatingSim: z.literal(true),
  consentPublicShowcase: z.boolean().default(false),
  identityConfirmed: z.literal(true),
});
export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;

export type OnboardingErrorCode = "email_taken" | "linkedin_required" | "instagram_required";

export class OnboardingError extends Error {
  readonly code: OnboardingErrorCode;
  constructor(code: OnboardingErrorCode, message: string) {
    super(message);
    this.name = "OnboardingError";
    this.code = code;
  }
}

export interface OnboardingResult {
  participantId: string;
}

export async function onboardParticipant(input: OnboardingInput): Promise<OnboardingResult> {
  // Throws UrlValidationError for malformed/unsupported URLs (mapped to 400 by the route).
  const linkedin = normalizeProfileUrl(input.linkedinUrl);
  if (linkedin.platform !== "linkedin") {
    throw new OnboardingError("linkedin_required", "A LinkedIn profile URL is required.");
  }
  const instagram = normalizeProfileUrl(input.instagramUrl);
  if (instagram.platform !== "instagram") {
    throw new OnboardingError("instagram_required", "An Instagram profile URL is required.");
  }

  const passwordHash = await hashPassword(input.password);

  const participant = await prisma.$transaction(async (tx) => {
    const existing = await tx.participant.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new OnboardingError("email_taken", "An account with that email already exists.");
    }
    return tx.participant.create({
      data: {
        displayName: input.displayName,
        email: input.email,
        passwordHash,
        isFictional: false,
        status: "onboarding",
        consent: {
          create: {
            adultConfirmed: true,
            consentDatingSim: true,
            consentPublicShowcase: input.consentPublicShowcase,
            identityConfirmed: true,
            consentAt: new Date(),
          },
        },
        sources: {
          create: [
            {
              platform: "linkedin",
              canonicalUrl: linkedin.canonicalUrl,
              handle: linkedin.handle,
              status: "pending",
            },
            {
              platform: "instagram",
              canonicalUrl: instagram.canonicalUrl,
              handle: instagram.handle,
              status: "pending",
            },
          ],
        },
      },
    });
  });

  return { participantId: participant.id };
}
