import type { AIMessage } from "../types";

export interface BiasQuestions {
  questions: string[];
}

/**
 * Generates 5 guided bias detection questions for a passage.
 */
export function buildBiasDetectionPrompt(passage: string): AIMessage[] {
  return [
    {
      role: "system",
      content: `Analyze the given passage and generate exactly 5 guided questions that help the reader identify potential biases, perspectives, and critical thinking gaps.

The 5 questions should cover:
1. Perspective: What viewpoint or perspective is missing from this passage?
2. Disagreement: Who might disagree with this, and why?
3. Fact vs Opinion: Which statements are facts, opinions, or interpretations?
4. Author Bias: What potential biases might the author have?
5. Mind-changing: What evidence would change your mind about the claims made here?

Each question should be specific to the passage content, not generic.

Respond ONLY in valid JSON:
{
  "questions": ["question1", "question2", "question3", "question4", "question5"]
}`,
    },
    {
      role: "user",
      content: `Analyze this passage for bias detection exercises:\n\n"${passage}"`,
    },
  ];
}

export interface BiasEvaluation {
  perspectiveScore: number;
  factOpinionScore: number;
  biasIdentificationScore: number;
  feedback: string;
}

/**
 * Evaluates user responses to bias detection questions.
 */
export function buildBiasEvaluationPrompt(
  passage: string,
  responses: Array<{ question: string; answer: string }>
): AIMessage[] {
  const responsesText = responses
    .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `Evaluate the student's responses to bias detection questions about a passage. Score each dimension from 0 to 1 (two decimal places).

Dimensions:
1. perspectiveScore (0-1): How well did the student identify missing perspectives and viewpoints?
2. factOpinionScore (0-1): How accurately did the student distinguish facts from opinions?
3. biasIdentificationScore (0-1): How effectively did the student identify potential biases?

Also provide brief (2-3 sentence) constructive feedback on their critical analysis skills.

Respond ONLY in valid JSON:
{
  "perspectiveScore": 0.0,
  "factOpinionScore": 0.0,
  "biasIdentificationScore": 0.0,
  "feedback": "string"
}`,
    },
    {
      role: "user",
      content: `Passage: "${passage}"

Student's responses:
${responsesText}

Evaluate their bias detection skills.`,
    },
  ];
}
