/**
 * Memoized access to the compiled showcase. Pages import these helpers; the run
 * is compiled once per process and cached. Deterministic, so no database needed.
 */

import { compileShowcase } from "./compiler";
import type { CompiledShowcase, ShowcaseDate, ShowcaseParticipant, ShowcaseRanking } from "./types";

let cached: CompiledShowcase | null = null;

export function getShowcase(): CompiledShowcase {
  if (!cached) cached = compileShowcase();
  return cached;
}

export function getParticipant(id: string): ShowcaseParticipant | undefined {
  return getShowcase().participants.find((p) => p.id === id);
}

export function getDate(id: string): ShowcaseDate | undefined {
  return getShowcase().dates.find((d) => d.id === id);
}

export function getRankingFor(participantId: string): ShowcaseRanking | undefined {
  return getShowcase().rankings.find((r) => r.forParticipantId === participantId);
}

/** Dates involving a participant (for their profile page). */
export function getDatesForParticipant(participantId: string): ShowcaseDate[] {
  return getShowcase().dates.filter(
    (d) => d.participantAId === participantId || d.participantBId === participantId,
  );
}

export type {
  CompiledShowcase,
  ShowcaseDate,
  ShowcaseParticipant,
  ShowcaseRanking,
} from "./types";
