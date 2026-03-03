import type { AIMessage } from "../types";

export function buildLearningPathPrompt(
  orderedConcepts: Array<{
    name: string;
    definition: string;
    difficulty: number;
  }>
): AIMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert curriculum designer. Given an ordered list of concepts (already sorted by prerequisites), group them into lessons of 3-7 concepts each.

Each lesson should:
- Have a clear, descriptive title
- Group thematically related concepts together
- Not break prerequisite chains (concepts must stay in the given order)
- Estimate study time: roughly 5 minutes per concept
- Assign an overall difficulty (1-5 scale)

Return ONLY valid JSON with this exact structure:
{
  "lessons": [
    {
      "title": "Lesson title",
      "description": "Brief description of what this lesson covers",
      "conceptNames": ["concept1", "concept2", "concept3"],
      "estimatedMinutes": 15,
      "difficulty": 2
    }
  ]
}`,
    },
    {
      role: "user",
      content: `Group these concepts into lessons:\n${JSON.stringify(
        orderedConcepts.map((c) => ({
          name: c.name,
          definition: c.definition,
          difficulty: c.difficulty,
        }))
      )}`,
    },
  ];
}
