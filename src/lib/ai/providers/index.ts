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

// Task routing — deepseek/deepseek-chat is primary (reliable, cheap)
// Free models moved to last fallback (rate-limited on free OpenRouter plans)
const TASK_MODEL_MAP: Record<
  AITaskType,
  { provider: AIProviderType; model: string }[]
> = {
  // Content Processing
  content_chunking: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  concept_extraction: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  relationship_mapping: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  argument_extraction: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],

  // Quiz & Flashcard Generation
  mcq_generation: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  true_false_generation: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  flashcard_generation: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  scenario_generation: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],

  // Critical Thinking
  socratic_questions: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  devils_advocate: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  bias_detection: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  what_if_scenarios: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  evaluate_response: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  teach_back_evaluation: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],

  // General
  summarize_section: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  explain_concept: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  deep_dive_qa: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  compare_concepts: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  ],
  general: [
    { provider: "openrouter", model: "deepseek/deepseek-chat" },
    { provider: "gemini", model: "gemini-2.0-flash" },
    { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
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
