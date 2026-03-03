export type AIProviderType = "openrouter" | "gemini" | "claude" | "grok";

export interface AIModel {
  id: string;
  provider: AIProviderType;
  name: string;
  contextWindow: number;
  speed: "fast" | "medium" | "slow";
  reasoning: "basic" | "good" | "excellent";
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AITaskType =
  | "content_chunking"
  | "concept_extraction"
  | "relationship_mapping"
  | "argument_extraction"
  | "mcq_generation"
  | "true_false_generation"
  | "flashcard_generation"
  | "scenario_generation"
  | "socratic_questions"
  | "devils_advocate"
  | "bias_detection"
  | "what_if_scenarios"
  | "evaluate_response"
  | "teach_back_evaluation"
  | "summarize_section"
  | "explain_concept"
  | "deep_dive_qa"
  | "compare_concepts"
  | "general";

export interface AICompletionRequest {
  model?: string;
  provider?: AIProviderType;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  taskType?: AITaskType;
  responseFormat?: "json" | "text";
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: AIProviderType;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached: boolean;
}

export interface AIProviderClient {
  id: AIProviderType;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  isAvailable(): boolean;
}
