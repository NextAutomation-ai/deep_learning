import { openrouterProvider } from "./openrouter";
import { geminiProvider } from "./gemini";
import { claudeProvider } from "./claude";
import { grokProvider } from "./grok";
import type { AIProviderType, AIProviderClient, AITaskType } from "../types";

const providers: Record<AIProviderType, AIProviderClient> = {
  openrouter: openrouterProvider,
  gemini: geminiProvider,
  claude: claudeProvider,
  grok: grokProvider,
};

// Task routing based on PRD Section 4.2
// Each task maps to an ordered list of [provider, model] fallback candidates
const TASK_MODEL_MAP: Record<
  AITaskType,
  { provider: AIProviderType; model: string }[]
> = {
  // Content Processing
  content_chunking: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "meta-llama/llama-4-scout" },
  ],
  concept_extraction: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  relationship_mapping: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  argument_extraction: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],

  // Quiz & Flashcard Generation
  mcq_generation: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  true_false_generation: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  flashcard_generation: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  scenario_generation: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],

  // Critical Thinking
  socratic_questions: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  devils_advocate: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  bias_detection: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  what_if_scenarios: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  evaluate_response: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  teach_back_evaluation: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],

  // General
  summarize_section: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "grok", model: "grok-3" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  explain_concept: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  deep_dive_qa: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  compare_concepts: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
  general: [
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
  ],
};

export function getProvider(id: AIProviderType): AIProviderClient {
  return providers[id];
}

export function getAvailableProviders(): AIProviderClient[] {
  return Object.values(providers).filter((p) => p.isAvailable());
}

export function selectModelForTask(
  taskType: AITaskType
): { provider: AIProviderType; model: string } | null {
  const candidates = TASK_MODEL_MAP[taskType] || TASK_MODEL_MAP.general;
  for (const candidate of candidates) {
    if (providers[candidate.provider].isAvailable()) {
      return candidate;
    }
  }
  // Last resort: return any available provider
  const available = getAvailableProviders();
  if (available.length > 0) {
    return { provider: available[0].id, model: "" };
  }
  return null;
}

export function getCandidatesForTask(
  taskType: AITaskType
): { provider: AIProviderType; model: string }[] {
  return TASK_MODEL_MAP[taskType] || TASK_MODEL_MAP.general;
}
