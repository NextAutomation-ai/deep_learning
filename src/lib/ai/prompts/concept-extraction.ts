import type { AIMessage } from "../types";

export function buildConceptExtractionPrompt(
  chunkText: string,
  chunkIndex: number
): AIMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert educational content analyzer.

Given the following text from a learning document, extract ALL key concepts, terms, theories, facts, processes, principles, people, events, and formulas mentioned.

For EACH concept, provide:
- name: Short name of the concept (2-5 words)
- definition: 1-2 sentence definition
- detailed_explanation: Thorough explanation (3-5 sentences)
- source_excerpt: The exact passage from the text where this concept appears (keep brief, 1-2 sentences)
- concept_type: One of [term, theory, argument, fact, process, principle, example, person, event, formula]
- difficulty_level: 1-5 (1=basic, 5=expert)
- blooms_level: Which Bloom's level is needed [remember, understand, apply, analyze, evaluate, create]
- prerequisites: List of other concept names that should be understood first (can be empty)
- tags: Relevant topic tags
- importance_score: 0.0-1.0 (1.0 = foundational concept)

IMPORTANT: Do NOT skip any concept, no matter how small. Every distinct idea should be captured.

Respond ONLY in valid JSON format:
{
  "concepts": [...]
}`,
    },
    {
      role: "user",
      content: `Extract ALL key concepts from the following text (chunk ${chunkIndex + 1}):\n\n${chunkText}`,
    },
  ];
}

export interface ExtractedConcept {
  name: string;
  definition: string;
  detailed_explanation?: string;
  source_excerpt?: string;
  concept_type: string;
  difficulty_level: number;
  blooms_level: string;
  prerequisites: string[];
  tags: string[];
  importance_score: number;
}
