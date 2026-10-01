/**
 * Types for the compiled, DB-free showcase. A CompiledShowcase is produced
 * deterministically by src/showcase/compiler.ts using the real domain engine,
 * serialized to JSON, and rendered by the showcase pages with no database.
 */

import type { GroundedItem } from "@/domain/fixture-dialogue";
import type { DateStage } from "@/domain/date-state";

export interface ShowcaseEvidence {
  stableId: string;
  platform: "linkedin" | "instagram";
  kind:
    | "profile_headline"
    | "profile_bio"
    | "profile_section"
    | "post_caption"
    | "experience"
    | "education";
  excerpt: string;
  sourceUrl: string;
  extractedAt: string;
}

export interface ShowcaseClaim {
  id: string;
  category:
    | "introduction"
    | "hobby"
    | "interest"
    | "professional_background"
    | "lifestyle_activity"
    | "conversation_topic"
    | "relationship_need";
  text: string;
  evidenceStableIds: string[];
  disposition: "explicit" | "tentative_interpretation";
  confidence: number;
  limitations?: string;
}

export interface ShowcaseSource {
  platform: "linkedin" | "instagram";
  canonicalUrl: string;
  handle: string;
  status: "complete" | "partial" | "unavailable";
  coverage: "full" | "partial" | "unavailable";
  extractedAt: string;
  note?: string;
}

export interface ShowcaseParticipant {
  id: string;
  displayName: string;
  headline: string;
  city: string;
  profession: string;
  isFictional: true;
  sources: ShowcaseSource[];
  evidence: ShowcaseEvidence[];
  claims: ShowcaseClaim[];
  unknowns: string[];
  /** Grounded interests fed to the agent (label = tag, evidenceId = stableId). */
  interests: GroundedItem[];
  conversationTopics: GroundedItem[];
  relationshipNeedKnown: boolean;
  /** Self evidence coverage 0..1 (both sources full = 1.0). */
  evidenceCoverageSelf: number;
  analysis: {
    version: number;
    modelVersion: string;
    rubricVersion: string;
    generatedAt: string;
  };
}

export interface ShowcaseMessage {
  turnIndex: number;
  stage: DateStage;
  speakerId: string;
  speakerName: string;
  content: string;
  citedEvidenceIds: string[];
  simulated: true;
}

export interface ShowcaseEvaluation {
  fromId: string;
  toId: string;
  dimensions: {
    sharedExplicitInterests: number;
    conversationQuality: number;
    scenarioAgreement: number;
    complementaryInterests: number;
  };
  evidenceCoverage: number;
  compatibility: number;
  uncertainty: number;
  explanation: string;
  citedTurnIndexes: number[];
  citedEvidenceIds: string[];
  strongestSharedInterests: string[];
  importantMissingInformation: string[];
  rubricVersion: string;
  modelVersion: string;
  generatedAt: string;
}

export interface ShowcaseDate {
  id: string;
  pairKey: string;
  participantAId: string;
  participantBId: string;
  aName: string;
  bName: string;
  scenario: string;
  status: "completed";
  totalTurns: number;
  messages: ShowcaseMessage[];
  /** Two directional evaluations: [a→b, b→a]. */
  evaluations: ShowcaseEvaluation[];
}

export interface ShowcaseRankingEntry {
  rank: number;
  candidateId: string;
  candidateName: string;
  compatibility: number;
  evidenceCoverage: number;
  uncertainty: number;
  dateId: string;
  strongestSharedInterests: string[];
  importantMissingInformation: string[];
}

export interface ShowcaseRanking {
  forParticipantId: string;
  forName: string;
  entries: ShowcaseRankingEntry[];
  provisional: boolean;
}

export interface CompiledShowcase {
  meta: {
    label: string;
    kind: "fictional";
    participantCount: number;
    totalPairs: number;
    completedPairs: number;
    rubricVersion: string;
    modelVersion: string;
    generatedAt: string;
    isPublic: boolean;
    note: string;
  };
  participants: ShowcaseParticipant[];
  dates: ShowcaseDate[];
  rankings: ShowcaseRanking[];
}
