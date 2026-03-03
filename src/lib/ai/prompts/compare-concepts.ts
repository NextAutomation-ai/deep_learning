import type { AIMessage } from "../types";

export interface ConceptCompareResult {
  similarities: string[];
  differences: string[];
  relationship: string;
  insight: string;
}

export function buildCompareConceptsPrompt(
  conceptA: { name: string; definition: string; detailedExplanation: string | null },
  conceptB: { name: string; definition: string; detailedExplanation: string | null },
  sourceContext: string
): AIMessage[] {
  const systemPrompt = `You are an expert teacher comparing two concepts from the same source material. Provide a thorough comparison.

Respond in valid JSON with this structure:
{
  "similarities": ["similarity 1", "similarity 2", ...],
  "differences": ["difference 1", "difference 2", ...],
  "relationship": "A brief description of how these concepts relate to each other",
  "insight": "A key insight or takeaway from comparing these concepts"
}

Provide 2-4 similarities, 2-4 differences, and make the relationship and insight concise but meaningful.

SOURCE CONTEXT:
${sourceContext}`;

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Compare these two concepts:

CONCEPT A: ${conceptA.name}
Definition: ${conceptA.definition}
${conceptA.detailedExplanation ? `Details: ${conceptA.detailedExplanation}` : ""}

CONCEPT B: ${conceptB.name}
Definition: ${conceptB.definition}
${conceptB.detailedExplanation ? `Details: ${conceptB.detailedExplanation}` : ""}`,
    },
  ];
}
