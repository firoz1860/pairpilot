import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  isTerminal,
  stageForTurn,
  actorForTurn,
  messageKey,
  canAppendTurn,
  planTurns,
  DATE_STAGES,
  DateStateError,
  MIN_TURNS,
  MAX_TURNS,
} from "./date-state";

describe("date state machine", () => {
  it("allows legal transitions", () => {
    expect(canTransition("pending", "running")).toBe(true);
    expect(canTransition("running", "paused")).toBe(true);
    expect(canTransition("paused", "running")).toBe(true);
    expect(canTransition("running", "completed")).toBe(true);
    expect(canTransition("running", "cancelled")).toBe(true);
  });

  it("rejects illegal transitions", () => {
    expect(canTransition("completed", "running")).toBe(false);
    expect(canTransition("pending", "completed")).toBe(false);
    expect(() => assertTransition("completed", "running")).toThrow(DateStateError);
  });

  it("marks terminal states", () => {
    expect(isTerminal("completed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("running")).toBe(false);
  });

  it("covers all four stages and puts reflection last for every valid total", () => {
    for (let total = MIN_TURNS; total <= MAX_TURNS; total += 1) {
      const stages = Array.from({ length: total }, (_, i) => stageForTurn(i, total));
      expect(new Set(stages)).toEqual(new Set(DATE_STAGES));
      expect(stages[total - 1]).toBe("reflection");
      expect(stages.filter((s) => s === "reflection")).toHaveLength(1);
    }
  });

  it("rejects out-of-range turn totals", () => {
    expect(() => stageForTurn(0, 7)).toThrow(DateStateError);
    expect(() => stageForTurn(0, 13)).toThrow(DateStateError);
  });

  it("alternates actors", () => {
    expect(actorForTurn(0, "a", "b")).toBe("a");
    expect(actorForTurn(1, "a", "b")).toBe("b");
    expect(actorForTurn(2, "a", "b")).toBe("a");
  });

  it("produces idempotent message keys and append guard", () => {
    expect(messageKey("sess1", 3)).toBe("sess1#3");
    // resume: only the next index may append; already-persisted turns are no-ops
    expect(canAppendTurn(5, 5)).toBe(true);
    expect(canAppendTurn(5, 4)).toBe(false);
    expect(canAppendTurn(5, 6)).toBe(false);
  });

  it("planTurns yields a full, ordered plan", () => {
    const plan = planTurns(10, "a", "b");
    expect(plan).toHaveLength(10);
    expect(plan[0]).toEqual({ turnIndex: 0, stage: "introduction", actor: "a" });
    expect(plan[9]!.stage).toBe("reflection");
  });
});
