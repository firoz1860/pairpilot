/**
 * Date-session state machine, stage planner, and message idempotency keys.
 *
 * A date runs ~8–12 substantive turns across four stages. The state machine
 * enforces legal transitions (pause/resume/cancel) and the message key makes
 * message insertion idempotent so an interrupted run resumes without
 * duplicating already-persisted turns.
 */

export const DATE_STAGES = [
  "introduction",
  "shared_interests",
  "practical_scenario",
  "reflection",
] as const;
export type DateStage = (typeof DATE_STAGES)[number];

export const DATE_STATUSES = [
  "pending",
  "running",
  "paused",
  "completed",
  "cancelled",
] as const;
export type DateStatus = (typeof DATE_STATUSES)[number];

export const MIN_TURNS = 8;
export const MAX_TURNS = 12;

const ALLOWED_TRANSITIONS: Readonly<Record<DateStatus, readonly DateStatus[]>> = {
  pending: ["running", "cancelled"],
  running: ["paused", "completed", "cancelled"],
  paused: ["running", "cancelled"],
  completed: [],
  cancelled: [],
};

export class DateStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateStateError";
  }
}

export function canTransition(from: DateStatus, to: DateStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: DateStatus, to: DateStatus): void {
  if (!canTransition(from, to)) {
    throw new DateStateError(`illegal date transition: ${from} -> ${to}`);
  }
}

export function isTerminal(status: DateStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

export function assertValidTurnTotal(totalTurns: number): void {
  if (!Number.isInteger(totalTurns) || totalTurns < MIN_TURNS || totalTurns > MAX_TURNS) {
    throw new DateStateError(
      `a date must have ${MIN_TURNS}-${MAX_TURNS} turns, received ${totalTurns}`,
    );
  }
}

/**
 * Map a zero-based turn index to a stage. The final turn is always reflection;
 * the remaining turns are split across the first three stages as evenly as
 * possible, in order.
 */
export function stageForTurn(turnIndex: number, totalTurns: number): DateStage {
  assertValidTurnTotal(totalTurns);
  if (turnIndex < 0 || turnIndex >= totalTurns) {
    throw new DateStateError(`turn index ${turnIndex} out of range for ${totalTurns} turns`);
  }
  if (turnIndex === totalTurns - 1) {
    return "reflection";
  }
  const workingTurns = totalTurns - 1; // all but the reflection turn
  const perStage = workingTurns / 3;
  if (turnIndex < Math.round(perStage)) {
    return "introduction";
  }
  if (turnIndex < Math.round(perStage * 2)) {
    return "shared_interests";
  }
  return "practical_scenario";
}

/** Agents alternate turns; even indices are the first participant. */
export function actorForTurn(turnIndex: number, participantA: string, participantB: string): string {
  return turnIndex % 2 === 0 ? participantA : participantB;
}

/**
 * Stable per-turn key. Combined with a unique DB constraint on
 * (dateSessionId, turnIndex) this guarantees idempotent message insertion.
 */
export function messageKey(dateSessionId: string, turnIndex: number): string {
  if (turnIndex < 0 || !Number.isInteger(turnIndex)) {
    throw new DateStateError(`turn index must be a non-negative integer, received ${turnIndex}`);
  }
  return `${dateSessionId}#${turnIndex}`;
}

/**
 * Guard for append-on-resume: a new message may only be appended at the exact
 * current turn count. Re-delivering an already-persisted turn is a no-op, never
 * a duplicate.
 */
export function canAppendTurn(persistedTurnCount: number, incomingTurnIndex: number): boolean {
  return incomingTurnIndex === persistedTurnCount;
}

export interface TurnPlan {
  turnIndex: number;
  stage: DateStage;
  actor: string;
}

export function planTurns(
  totalTurns: number,
  participantA: string,
  participantB: string,
): TurnPlan[] {
  assertValidTurnTotal(totalTurns);
  const plan: TurnPlan[] = [];
  for (let i = 0; i < totalTurns; i += 1) {
    plan.push({
      turnIndex: i,
      stage: stageForTurn(i, totalTurns),
      actor: actorForTurn(i, participantA, participantB),
    });
  }
  return plan;
}
