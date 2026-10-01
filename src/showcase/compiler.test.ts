import { describe, it, expect } from "vitest";
import { compileShowcase } from "./compiler";
import { classifySensitive } from "@/domain/sensitive";
import { MIN_TURNS, MAX_TURNS } from "@/domain/date-state";

const showcase = compileShowcase();

describe("compiled showcase", () => {
  it("has 25 clearly-fictional participants", () => {
    expect(showcase.participants).toHaveLength(25);
    expect(showcase.participants.every((p) => p.isFictional)).toBe(true);
    expect(showcase.meta.participantCount).toBe(25);
  });

  it("contains exactly 300 unique completed pairs", () => {
    expect(showcase.dates).toHaveLength(300);
    expect(showcase.meta.totalPairs).toBe(300);
    expect(showcase.meta.completedPairs).toBe(300);
    const keys = new Set(showcase.dates.map((d) => d.pairKey));
    expect(keys.size).toBe(300);
    expect(showcase.dates.every((d) => d.status === "completed")).toBe(true);
  });

  it("produces 600 directional evaluations (two per date)", () => {
    const total = showcase.dates.reduce((n, d) => n + d.evaluations.length, 0);
    expect(total).toBe(600);
    expect(showcase.dates.every((d) => d.evaluations.length === 2)).toBe(true);
  });

  it("each date has 8–12 persisted, alternating, correctly-staged messages", () => {
    for (const d of showcase.dates) {
      expect(d.messages.length).toBeGreaterThanOrEqual(MIN_TURNS);
      expect(d.messages.length).toBeLessThanOrEqual(MAX_TURNS);
      expect(d.messages).toHaveLength(d.totalTurns);
      expect(d.messages[0]!.turnIndex).toBe(0);
      expect(d.messages.at(-1)!.stage).toBe("reflection");
      expect(d.messages.every((m) => m.simulated === true)).toBe(true);
    }
  });

  it("gives each participant 24 directional rankings", () => {
    expect(showcase.rankings).toHaveLength(25);
    for (const r of showcase.rankings) {
      expect(r.entries).toHaveLength(24);
      expect(r.entries[0]!.rank).toBe(1);
      expect(r.entries.at(-1)!.rank).toBe(24);
      for (let i = 1; i < r.entries.length; i += 1) {
        expect(r.entries[i - 1]!.compatibility).toBeGreaterThanOrEqual(r.entries[i]!.compatibility);
      }
    }
  });

  it("rankings reference existing dates and evaluations", () => {
    const dateIds = new Set(showcase.dates.map((d) => d.id));
    for (const r of showcase.rankings) {
      for (const e of r.entries) {
        expect(dateIds.has(e.dateId)).toBe(true);
      }
    }
  });

  it("every evaluation cites real transcript turns and existing evidence", () => {
    const evidenceByParticipant = new Map(
      showcase.participants.map((p) => [p.id, new Set(p.evidence.map((e) => e.stableId))]),
    );
    for (const d of showcase.dates) {
      const turnRange = d.messages.length;
      for (const ev of d.evaluations) {
        expect(ev.citedTurnIndexes.length).toBeGreaterThan(0);
        expect(ev.citedTurnIndexes.every((t) => t >= 0 && t < turnRange)).toBe(true);
        const fromEvidence = evidenceByParticipant.get(ev.fromId)!;
        expect(ev.citedEvidenceIds.every((id) => fromEvidence.has(id))).toBe(true);
      }
    }
  });

  it("contains no sensitive inferences in any claim", () => {
    for (const p of showcase.participants) {
      for (const c of p.claims) {
        expect(classifySensitive(c.text)).toEqual([]);
      }
    }
  });

  it("leaves relationship needs unestablished for every participant", () => {
    for (const p of showcase.participants) {
      expect(p.relationshipNeedKnown).toBe(false);
      expect(p.unknowns.join(" ").toLowerCase()).toContain("relationship needs");
      expect(p.claims.some((c) => c.category === "relationship_need")).toBe(false);
    }
  });

  it("is deterministic (compiling twice yields identical output)", () => {
    expect(JSON.stringify(compileShowcase())).toBe(JSON.stringify(showcase));
  });
});
