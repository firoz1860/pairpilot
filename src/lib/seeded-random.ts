/**
 * Deterministic pseudo-randomness. Every "random" choice in the simulated
 * dating harness is seeded from stable inputs (session id + turn index) so
 * that fixture runs are fully reproducible and testable.
 */

/** Mulberry32 PRNG — small, fast, deterministic given a 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit string hash, used to derive a numeric seed from a string. */
export function hashStringToSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Build a deterministic RNG from any string key. */
export function seededRng(key: string): () => number {
  return mulberry32(hashStringToSeed(key));
}

/** Deterministically pick one element using the provided RNG. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error("cannot pick from an empty array");
  }
  const index = Math.floor(rng() * arr.length);
  return arr[index] as T;
}
