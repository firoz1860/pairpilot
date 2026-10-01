import { describe, it, expect } from "vitest";
import { classifySensitive, filterClaims } from "./sensitive";
import type { Claim } from "./analysis-schema";

const claim = (id: string, text: string): Claim => ({
  id,
  category: "interest",
  text,
  evidenceIds: ["e1"],
  disposition: "tentative_interpretation",
  confidence: 0.6,
});

describe("sensitive inference rejection", () => {
  it("flags sensitive categories", () => {
    expect(classifySensitive("probably gay based on photos")).toContain("sexual_orientation");
    expect(classifySensitive("seems very attractive and good-looking")).toContain("appearance");
    expect(classifySensitive("likely a devout Catholic")).toContain("religion");
    expect(classifySensitive("appears to be single and dating")).toContain("relationship_status");
    expect(classifySensitive("high net worth individual")).toContain("wealth");
  });

  it("does not flag ordinary, permitted interests", () => {
    expect(classifySensitive("enjoys hiking and landscape photography")).toEqual([]);
  });

  it("filters sensitive claims out of model output, keeping permitted ones", () => {
    const { accepted, rejected } = filterClaims([
      claim("1", "enjoys trail running"),
      claim("2", "probably bisexual"),
      claim("3", "interested in jazz piano"),
      claim("4", "looks very attractive"),
    ]);
    expect(accepted.map((c) => c.id)).toEqual(["1", "3"]);
    expect(rejected.map((r) => r.claim.id)).toEqual(["2", "4"]);
    expect(rejected[0]!.categories).toContain("sexual_orientation");
  });
});
