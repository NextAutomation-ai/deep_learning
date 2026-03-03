import type { AIMessage } from "../types";

interface ConversationMessage {
  role: "ai" | "user";
  content: string;
}

/**
 * Generates the next Socratic probing question based on conversation history.
 */
export function buildSocraticQuestionPrompt(
  conceptName: string,
  conceptDefinition: string,
  sourceContext: string,
  conversationHistory: ConversationMessage[]
): AIMessage[] {
  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map((m) => `${m.role === "ai" ? "Questioner" : "Student"}: ${m.content}`)
          .join("\n")
      : "";

  return [
    {
      role: "system",
      content: `You are a Socratic questioner helping a student deeply understand a concept through guided inquiry. Your role is to ask ONE thought-provoking question at a time that challenges the student's understanding.

Your questions should probe:
- Assumptions underlying the concept
- Evidence and reasoning
- Alternative perspectives and counterexamples
- Logical implications and connections
- Real-world applications and edge cases

Guidelines:
- Ask exactly ONE question per response
- Build on the student's previous answers
- Start with foundational questions and progressively go deeper
- Be encouraging but intellectually rigorous
- If the student's answer is shallow, ask a follow-up that pushes for depth
- If the student shows strong understanding, challenge with harder angles

Respond with ONLY the question text, no preamble.`,
    },
    {
      role: "user",
      content: `Concept: ${conceptName}
Definition: ${conceptDefinition}
${sourceContext ? `Source context: ${sourceContext}` : ""}

${historyText ? `Conversation so far:\n${historyText}\n\nGenerate the next probing question.` : "Generate the first probing question about this concept."}`,
    },
  ];
}

export interface SocraticEvaluation {
  depth: number;
  evidence: number;
  alternatives: number;
  coherence: number;
  feedback: string;
}

/**
 * Evaluates the overall quality of a student's responses in a Socratic session.
 */
export function buildSocraticEvaluationPrompt(
  conceptName: string,
  conversationHistory: ConversationMessage[]
): AIMessage[] {
  const historyText = conversationHistory
    .map((m) => `${m.role === "ai" ? "Questioner" : "Student"}: ${m.content}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `Evaluate the student's performance in this Socratic questioning session. Score each dimension from 0 to 1 (two decimal places).

Dimensions:
1. depth (0-1): How substantive and well-developed is the student's thinking?
2. evidence (0-1): Does the student cite specific evidence, examples, or data?
3. alternatives (0-1): Does the student consider multiple viewpoints and counterarguments?
4. coherence (0-1): Is the student's reasoning logically sound and consistent?

Also provide a brief (2-3 sentence) constructive feedback summary.

Respond ONLY in valid JSON:
{
  "depth": 0.0,
  "evidence": 0.0,
  "alternatives": 0.0,
  "coherence": 0.0,
  "feedback": "string"
}`,
    },
    {
      role: "user",
      content: `Concept being discussed: ${conceptName}

Conversation:
${historyText}

Evaluate the student's responses.`,
    },
  ];
}
