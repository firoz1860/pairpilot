/**
 * Deterministic, evidence-grounded dialogue generator.
 *
 * This is the CLEARLY-LABELED simulation engine used when no live LLM provider
 * is configured. It never fabricates personal memories, dating preferences, or
 * commitments: it only references interests/topics that were approved from a
 * participant's own sources, and it explicitly acknowledges unknowns (e.g. a
 * relationship need that is "not established from sources").
 *
 * Every message is tagged `simulated: true` and is spoken by the *agent for* a
 * participant — never as the participant themselves. Output is deterministic
 * given (dateSessionId, turnIndex), so runs are reproducible and testable.
 *
 * Because source text only ever enters as plain string data inside fixed
 * templates, prompt-injection content in a label cannot change the structure
 * or behavior of a generated turn.
 */

import { seededRng, pick } from "@/lib/seeded-random";
import type { DateStage } from "@/domain/date-state";

export interface GroundedItem {
  label: string;
  evidenceId: string;
}

export interface AgentPersona {
  participantId: string;
  displayName: string;
  interests: GroundedItem[];
  conversationTopics: GroundedItem[];
  /** Whether an explicit relationship need exists in the sources. */
  relationshipNeedKnown: boolean;
  relationshipNeed?: string;
}

export interface DialogueContext {
  dateSessionId: string;
  turnIndex: number;
  stage: DateStage;
  speaker: AgentPersona;
  listener: AgentPersona;
  scenario: string;
}

export interface GeneratedTurn {
  content: string;
  citedEvidenceIds: string[];
  simulated: true;
}

function sharedInterests(a: AgentPersona, b: AgentPersona): GroundedItem[] {
  const bLabels = new Set(b.interests.map((i) => i.label.toLowerCase()));
  return a.interests.filter((i) => bLabels.has(i.label.toLowerCase()));
}

function agentName(persona: AgentPersona): string {
  return `${persona.displayName}'s agent`;
}

export function generateFixtureTurn(ctx: DialogueContext): GeneratedTurn {
  const rng = seededRng(`${ctx.dateSessionId}#${ctx.turnIndex}`);
  const { speaker, listener } = ctx;
  const shared = sharedInterests(speaker, listener);
  const cited: string[] = [];
  let content: string;

  const ownInterest = speaker.interests.length > 0 ? pick(rng, speaker.interests) : null;

  switch (ctx.stage) {
    case "introduction": {
      if (ownInterest) {
        cited.push(ownInterest.evidenceId);
        const openers = [
          `Hi — I'm ${agentName(speaker)}. From ${speaker.displayName}'s public profile, one clear interest is ${ownInterest.label}.`,
          `Hello, ${agentName(speaker)} here. ${speaker.displayName}'s sources point to ${ownInterest.label} as a genuine interest.`,
          `I'm ${agentName(speaker)}. What stands out in ${speaker.displayName}'s profile is ${ownInterest.label}.`,
        ];
        content = pick(rng, openers);
      } else {
        content = `Hi — I'm ${agentName(speaker)}. ${speaker.displayName}'s public sources are sparse, so I'll keep claims limited to what's actually stated.`;
      }
      break;
    }

    case "shared_interests": {
      if (shared.length > 0) {
        const common = pick(rng, shared);
        cited.push(common.evidenceId);
        const lines = [
          `We seem to overlap on ${common.label} — that's stated in both profiles, so it's a solid place to start.`,
          `There's real common ground here: ${common.label} shows up in both sources. What draws ${listener.displayName} to it?`,
          `Both profiles mention ${common.label}. I'd rather build on that than assume anything not in the sources.`,
        ];
        content = pick(rng, lines);
      } else if (ownInterest) {
        cited.push(ownInterest.evidenceId);
        const lines = [
          `Our interests don't obviously overlap — ${speaker.displayName} is into ${ownInterest.label}. Different interests can still make a good conversation.`,
          `I don't see a shared interest in the sources, which is fine. ${speaker.displayName} leans toward ${ownInterest.label}; curious what that maps to on your side.`,
        ];
        content = pick(rng, lines);
      } else {
        content = `I can't point to a shared interest from the available sources, so I'll avoid inventing one.`;
      }
      break;
    }

    case "practical_scenario": {
      const anchor = shared[0] ?? ownInterest;
      if (anchor) {
        cited.push(anchor.evidenceId);
        const disagree = rng() < 0.35;
        if (disagree) {
          content = `For "${ctx.scenario}", I'd actually steer away from the obvious option and lean on ${anchor.label} instead — a respectful difference, but it's grounded in ${speaker.displayName}'s sources. Could we meet halfway?`;
        } else {
          content = `For "${ctx.scenario}", building the plan around ${anchor.label} fits what's documented. Shall we sketch concrete steps?`;
        }
      } else {
        content = `For "${ctx.scenario}", I don't have enough sourced detail to anchor a strong plan, so I'd keep it open and ask rather than assume.`;
      }
      break;
    }

    case "reflection": {
      const needNote = speaker.relationshipNeedKnown
        ? `${speaker.displayName}'s stated relationship need is noted in the sources.`
        : `${speaker.displayName}'s relationship needs are not established from the sources, so I won't guess them.`;
      const fitNote =
        shared.length > 0
          ? `The conversation had genuine common ground.`
          : `The conversation showed workable differences rather than strong overlap.`;
      content = `Reflecting as a simulation: ${fitNote} ${needNote} This is my assessment of conversational fit, not a statement by ${speaker.displayName}.`;
      break;
    }

    default: {
      content = `(${agentName(speaker)}) continuing the conversation grounded in sourced interests.`;
    }
  }

  return { content, citedEvidenceIds: cited, simulated: true };
}
