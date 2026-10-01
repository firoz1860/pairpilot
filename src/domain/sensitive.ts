/**
 * Reject sensitive and non-permitted inferences.
 *
 * The analysis must never infer sexual orientation, health, religion,
 * ethnicity, political beliefs, or relationship status, and must never judge
 * physical attractiveness or wealth. Any generated claim that touches these
 * categories is filtered out before it can be stored or shown — even if the
 * model emitted it. This is a hard safety gate, not a ranking input.
 */

import type { Claim } from "@/domain/analysis-schema";

export type SensitiveCategory =
  | "sexual_orientation"
  | "health"
  | "religion"
  | "ethnicity"
  | "political"
  | "relationship_status"
  | "appearance"
  | "wealth";

const KEYWORDS: Readonly<Record<SensitiveCategory, readonly RegExp[]>> = {
  sexual_orientation: [
    /\b(gay|lesbian|bisexual|bi-sexual|straight|heterosexual|homosexual|queer|lgbtq?)\b/i,
    /\bsexual orientation\b/i,
  ],
  health: [
    /\b(depress(ed|ion)|anxiety|adhd|autis(m|tic)|bipolar|disabled|disability|illness|disease|diagnos(ed|is)|medication|therapy|mental health)\b/i,
  ],
  religion: [
    /\b(christian|catholic|muslim|islam|hindu|buddhist|jewish|judaism|atheist|religious|faith|church|mosque|temple|synagogue)\b/i,
  ],
  ethnicity: [
    /\b(race|racial|ethnic(ity)?|caucasian|asian|black|white|latino|latina|hispanic|african|indian|arab)\b/i,
  ],
  political: [
    /\b(democrat|republican|conservative|liberal|left-wing|right-wing|political|politics|voter?|election)\b/i,
  ],
  relationship_status: [
    /\b(single|married|divorced|widowed|dating|in a relationship|engaged|boyfriend|girlfriend|spouse)\b/i,
  ],
  appearance: [
    /\b(attractive|good-looking|handsome|beautiful|pretty|hot|sexy|ugly|fit body|physique|looks?)\b/i,
  ],
  wealth: [
    /\b(rich|wealthy|affluent|high[- ]net[- ]worth|net worth|salary|income|expensive lifestyle)\b/i,
  ],
};

/** Return every sensitive category whose keywords appear in the text. */
export function classifySensitive(text: string): SensitiveCategory[] {
  const matched: SensitiveCategory[] = [];
  for (const category of Object.keys(KEYWORDS) as SensitiveCategory[]) {
    if (KEYWORDS[category].some((re) => re.test(text))) {
      matched.push(category);
    }
  }
  return matched;
}

export function isSensitiveClaim(claim: Pick<Claim, "text">): boolean {
  return classifySensitive(claim.text).length > 0;
}

export interface RejectedClaim {
  claim: Claim;
  categories: SensitiveCategory[];
}

export interface ClaimFilterResult {
  accepted: Claim[];
  rejected: RejectedClaim[];
}

/**
 * Partition claims into accepted vs rejected. A claim is rejected if it touches
 * any sensitive category. This runs on model output before persistence.
 */
export function filterClaims(claims: readonly Claim[]): ClaimFilterResult {
  const accepted: Claim[] = [];
  const rejected: RejectedClaim[] = [];
  for (const claim of claims) {
    const categories = classifySensitive(claim.text);
    if (categories.length > 0) {
      rejected.push({ claim, categories });
    } else {
      accepted.push(claim);
    }
  }
  return { accepted, rejected };
}
