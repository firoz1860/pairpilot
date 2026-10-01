/**
 * Fixture source provider. Returns clearly-labeled fictional source documents
 * so the pipeline can run end-to-end with no network and no real scraping.
 * It NEVER claims to have read a real person's profile.
 */

import { seededRng, pick, hashStringToSeed } from "@/lib/seeded-random";
import type { Platform, SourceDocument, SourceProvider } from "./types";

const INTEREST_POOL = [
  "trail running",
  "specialty coffee",
  "board games",
  "cycling",
  "home cooking",
  "film photography",
  "hiking",
  "reading sci-fi",
  "jazz piano",
  "travel",
];

export class FixtureSourceProvider implements SourceProvider {
  readonly name = "fixture";
  readonly mode = "fixture" as const;

  async fetchProfile(canonicalUrl: string, platform: Platform): Promise<SourceDocument> {
    const rng = seededRng(canonicalUrl);
    const seed = hashStringToSeed(canonicalUrl);
    const a = pick(rng, INTEREST_POOL);
    const b = pick(rng, INTEREST_POOL);
    const base = `${platform}-${seed.toString(36)}`;
    const extractedAt = new Date("2026-09-15T10:00:00.000Z").toISOString();

    if (platform === "linkedin") {
      return {
        canonicalUrl,
        platform,
        publicName: "Fictional Demo Profile",
        publicBio: undefined,
        sections: [
          { kind: "profile_headline", text: "Demo engineer (fictional persona).", evidenceStableId: `${base}-headline` },
          { kind: "profile_section", text: `Outside work I'm into ${a} and ${b}.`, evidenceStableId: `${base}-about` },
          { kind: "experience", text: "Experience: demo role at a fictional company.", evidenceStableId: `${base}-exp` },
        ],
        postCaptions: [],
        extractedAt,
        providerStatus: "ok",
        limitations: ["Fixture mode — fictional content, not a real profile."],
      };
    }

    return {
      canonicalUrl,
      platform,
      publicName: "Fictional Demo Profile",
      publicBio: `${a} + ${b}. Weekend ${a}.`,
      sections: [
        { kind: "profile_bio", text: `${a} + ${b}. Weekend ${a}.`, evidenceStableId: `${base}-bio` },
      ],
      postCaptions: [
        { text: `Good day out — ${a} again.`, timestamp: extractedAt, evidenceStableId: `${base}-cap1` },
      ],
      extractedAt,
      providerStatus: "ok",
      limitations: ["Fixture mode — fictional content, not a real profile."],
    };
  }
}
