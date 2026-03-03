import type { AIMessage } from "../types";

export function buildArgumentExtractionPrompt(
  chunkText: string
): AIMessage[] {
  return [
    {
      role: "system",
      content: `Analyze the following text for arguments, claims, and reasoning.

Extract:
1. thesis: Main thesis/claim being made
2. premises: Stated reasons supporting the thesis (array of strings)
3. evidence: Evidence cited — data, studies, examples (array of strings)
4. assumptions: Unstated assumptions (array of strings)
5. conclusion: The conclusion drawn
6. logical_structure: "deductive", "inductive", or "abductive"
7. fallacies: Any logical fallacies present (array of strings, can be empty)
8. strength_score: 0-1 rating of argument strength
9. counter_arguments: Possible counter-arguments (array of strings)

If the text contains multiple distinct arguments, extract each separately.

Respond ONLY in valid JSON format:
{
  "arguments": [...]
}`,
    },
    {
      role: "user",
      content: `Analyze arguments in this text:\n\n${chunkText}`,
    },
  ];
}

export interface ExtractedArgument {
  thesis: string;
  premises: string[];
  evidence: string[];
  assumptions: string[];
  conclusion: string;
  logical_structure: string;
  fallacies: string[];
  strength_score: number;
  counter_arguments: string[];
}
