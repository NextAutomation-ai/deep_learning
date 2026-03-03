import type { AIMessage } from "../types";

export interface TeachBackEvaluation {
  accuracyScore: number;
  completenessScore: number;
  reasoningScore: number;
  criticalThinkingScore: number;
  feedback: string;
}

/**
 * Evaluates a student's teach-back explanation of a concept.
 */
export function buildTeachBackEvaluationPrompt(
  conceptName: string,
  conceptDefinition: string,
  detailedExplanation: string | null,
  userExplanation: string
): AIMessage[] {
  return [
    {
      role: "system",
      content: `Evaluate how well a student explained a concept as if teaching it to someone unfamiliar with the topic. Score each dimension from 0 to 1 (two decimal places).

Dimensions:
1. accuracyScore (0-1): Does the explanation correctly represent the concept? Are there any factual errors?
2. completenessScore (0-1): Are all key components of the concept covered? Is anything important missing?
3. reasoningScore (0-1): Is the explanation clear and well-structured? Would a beginner understand it?
4. criticalThinkingScore (0-1): Does the student use examples, analogies, or demonstrate deeper understanding beyond rote memorization?

Also provide brief (2-3 sentence) constructive feedback highlighting what was done well and what could be improved.

Respond ONLY in valid JSON:
{
  "accuracyScore": 0.0,
  "completenessScore": 0.0,
  "reasoningScore": 0.0,
  "criticalThinkingScore": 0.0,
  "feedback": "string"
}`,
    },
    {
      role: "user",
      content: `Concept: ${conceptName}
Correct definition: ${conceptDefinition}
${detailedExplanation ? `Detailed explanation: ${detailedExplanation}` : ""}

Student's teach-back explanation:
"${userExplanation}"

Evaluate this explanation.`,
    },
  ];
}
