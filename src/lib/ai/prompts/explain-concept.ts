import type { AIMessage } from "../types";

export function buildExplainConceptPrompt(
  concept: {
    name: string;
    definition: string;
    detailedExplanation: string | null;
    sourceExcerpt: string | null;
  },
  mode: "simpler" | "deeper" | "analogy" | "example"
): AIMessage[] {
  const modeInstructions: Record<string, string> = {
    simpler:
      "Explain this concept in the simplest possible terms, as if to a beginner with no prior knowledge. Use everyday language, short sentences, and avoid jargon.",
    deeper:
      "Provide a more technical, in-depth explanation of this concept. Include nuances, edge cases, and connections to related topics. Assume the reader has basic familiarity.",
    analogy:
      "Explain this concept using a creative, memorable analogy or metaphor. Make it relatable to everyday life.",
    example:
      "Explain this concept by providing 2-3 concrete, practical examples. Show how it applies in real scenarios.",
  };

  return [
    {
      role: "system",
      content: `You are an expert teacher. ${modeInstructions[mode]}

Keep your response concise (150-300 words). Use markdown formatting for readability.`,
    },
    {
      role: "user",
      content: `Concept: ${concept.name}
Definition: ${concept.definition}
${concept.detailedExplanation ? `Current explanation: ${concept.detailedExplanation}` : ""}
${concept.sourceExcerpt ? `Source context: ${concept.sourceExcerpt}` : ""}

Please explain this concept.`,
    },
  ];
}
