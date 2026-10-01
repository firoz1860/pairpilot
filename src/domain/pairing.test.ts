import { describe, it, expect } from "vitest";
import {
  pairCount,
  uniquePairs,
  pairKey,
  assertDistinct,
  directionalAssessments,
} from "./pairing";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

describe("pairing", () => {
  it("C(25,2) is exactly 300", () => {
    expect(pairCount(25)).toBe(300);
  });

  it("a 25-person run produces exactly 300 unique pairs", () => {
    const pairs = uniquePairs(ids(25));
    expect(pairs).toHaveLength(300);
    const keys = new Set(pairs.map((p) => p.key));
    expect(keys.size).toBe(300);
  });

  it("produces 600 directional assessments for 300 pairs (24 per participant)", () => {
    const pairs = uniquePairs(ids(25));
    const directional = directionalAssessments(pairs);
    expect(directional).toHaveLength(600);
    const perParticipant = directional.filter((d) => d.from === "p1");
    expect(perParticipant).toHaveLength(24);
  });

  it("pairKey is order-independent", () => {
    expect(pairKey("a", "b")).toBe(pairKey("b", "a"));
  });

  it("pairKey rejects a self-pair", () => {
    expect(() => pairKey("a", "a")).toThrow();
  });

  it("rejects duplicate participant ids", () => {
    expect(() => assertDistinct(["a", "b", "a"])).toThrow(/duplicate/);
    expect(() => uniquePairs(["a", "a"])).toThrow();
  });

  it("pairCount rejects invalid input", () => {
    expect(() => pairCount(-1)).toThrow();
    expect(() => pairCount(2.5)).toThrow();
  });
});
