/**
 * Pairing math for the dating harness.
 *
 * For a showcase of N eligible participants we run every unique *unordered*
 * pair exactly once (N choose 2), then produce a *directional* assessment for
 * each participant within every pair. For N = 25 that is 300 pairs and 600
 * directional assessments; each fully-eligible participant is ranked against
 * the other 24.
 */

/** Number of unique unordered pairs for n items: C(n, 2). */
export function pairCount(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("participant count must be a non-negative integer");
  }
  return (n * (n - 1)) / 2;
}

/** Throw if the id list contains duplicates (pairs must be between distinct participants). */
export function assertDistinct(ids: readonly string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`duplicate participant id in pairing input: ${id}`);
    }
    seen.add(id);
  }
}

/**
 * Stable, order-independent key for an unordered pair. pairKey(a, b) always
 * equals pairKey(b, a), which lets the queue de-duplicate pairs idempotently.
 */
export function pairKey(a: string, b: string): string {
  if (a === b) {
    throw new Error("a pair must reference two distinct participants");
  }
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export interface UnorderedPair {
  a: string;
  b: string;
  key: string;
}

/** All unique unordered pairs from a list of distinct ids, in stable order. */
export function uniquePairs(ids: readonly string[]): UnorderedPair[] {
  assertDistinct(ids);
  const out: UnorderedPair[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = ids[i] as string;
      const b = ids[j] as string;
      out.push({ a, b, key: pairKey(a, b) });
    }
  }
  return out;
}

/** The two directional assessments (a→b and b→a) implied by one pair. */
export interface DirectionalAssessment {
  from: string;
  to: string;
}

export function directionalAssessments(pairs: readonly UnorderedPair[]): DirectionalAssessment[] {
  const out: DirectionalAssessment[] = [];
  for (const p of pairs) {
    out.push({ from: p.a, to: p.b });
    out.push({ from: p.b, to: p.a });
  }
  return out;
}
