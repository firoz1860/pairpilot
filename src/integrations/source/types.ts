/** Normalized source-extraction contract shared by every provider. */

export type Platform = "linkedin" | "instagram";
export type ProviderStatus = "ok" | "partial" | "unavailable";

export interface SourceSection {
  kind: "profile_headline" | "profile_bio" | "profile_section" | "experience" | "education";
  text: string;
  evidenceStableId: string;
}

export interface SourcePost {
  text: string;
  timestamp?: string;
  evidenceStableId: string;
}

export interface SourceDocument {
  canonicalUrl: string;
  platform: Platform;
  publicName?: string;
  publicBio?: string;
  sections: SourceSection[];
  postCaptions: SourcePost[];
  extractedAt: string;
  providerStatus: ProviderStatus;
  /** Honest list of what could NOT be retrieved. Never claims full coverage falsely. */
  limitations: string[];
}

export interface SourceProvider {
  readonly name: string;
  readonly mode: "fixture" | "live";
  fetchProfile(canonicalUrl: string, platform: Platform): Promise<SourceDocument>;
}

export class SourceUnavailableError extends Error {
  readonly code = "source_unavailable";
  constructor(message: string) {
    super(message);
    this.name = "SourceUnavailableError";
  }
}
