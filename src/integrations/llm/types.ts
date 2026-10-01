import type { SourceDocument } from "@/integrations/source/types";
import type { Analysis, EvaluatorOutput } from "@/domain/analysis-schema";
import type { DateStage } from "@/domain/date-state";

export interface PersonaInput {
  participantId: string;
  displayName: string;
  interests: { label: string; evidenceId: string }[];
  conversationTopics: { label: string; evidenceId: string }[];
  relationshipNeedKnown: boolean;
}

export interface AnalysisRequest {
  participantId: string;
  displayName: string;
  analysisVersion: number;
  sources: SourceDocument[];
}

export interface DateTurnRequest {
  dateSessionId: string;
  turnIndex: number;
  stage: DateStage;
  scenario: string;
  speaker: PersonaInput;
  listener: PersonaInput;
  history: { speakerId: string; content: string }[];
}

export interface EvaluationRequest {
  from: PersonaInput;
  to: PersonaInput;
  transcript: { turnIndex: number; stage: DateStage; speakerId: string; content: string }[];
  coverage: { from: number; to: number };
}

export interface GeneratedTurn {
  content: string;
  citedEvidenceIds: string[];
  modelVersion: string;
  simulated: true;
}

export interface LlmProvider {
  readonly name: string;
  readonly mode: "fixture" | "anthropic";
  generateAnalysis(req: AnalysisRequest): Promise<Analysis>;
  generateDateTurn(req: DateTurnRequest): Promise<GeneratedTurn>;
  generateEvaluation(req: EvaluationRequest): Promise<EvaluatorOutput>;
}

export class LlmUnavailableError extends Error {
  readonly code = "llm_unavailable";
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}
