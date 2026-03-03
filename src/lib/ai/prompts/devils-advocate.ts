import type { AIMessage } from "../types";

interface ConversationMessage {
  role: "ai" | "user";
  content: string;
}

/**
 * Generates a counter-argument to a claim, arguing the opposite position.
 */
export function buildDevilsAdvocatePrompt(
  claim: string,
  steelManMode: boolean,
  conversationHistory: ConversationMessage[]
): AIMessage[] {
  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map((m) => `${m.role === "ai" ? "Devil's Advocate" : "Defender"}: ${m.content}`)
          .join("\n")
      : "";

  const modeInstruction = steelManMode
    ? "Present the STRONGEST possible counter-argument (steel man). Use the most compelling evidence, logic, and reasoning to challenge the claim. Do not use weak or easily dismissed objections."
    : "Present a thoughtful counter-argument that challenges the claim. Be rigorous but fair.";

  return [
    {
      role: "system",
      content: `You are playing Devil's Advocate in an intellectual debate. Your role is to argue AGAINST the given claim to help the student strengthen their reasoning.

${modeInstruction}

Guidelines:
- Present ONE focused counter-argument per response
- Use specific reasoning, evidence, or logical analysis
- Be respectful but intellectually challenging
- Build on previous exchanges to deepen the debate
- Acknowledge valid points the student makes before countering

Respond with ONLY your counter-argument, no meta-commentary.`,
    },
    {
      role: "user",
      content: `Original claim: "${claim}"

${historyText ? `Debate so far:\n${historyText}\n\nGenerate the next counter-argument.` : "Generate your opening counter-argument against this claim."}`,
    },
  ];
}

export interface DefenseEvaluation {
  reasoning: number;
  evidence: number;
  counterPoints: number;
  feedback: string;
}

/**
 * Evaluates the quality of a student's defense in a Devil's Advocate debate.
 */
export function buildDefenseEvaluationPrompt(
  originalClaim: string,
  conversationHistory: ConversationMessage[]
): AIMessage[] {
  const historyText = conversationHistory
    .map((m) => `${m.role === "ai" ? "Devil's Advocate" : "Defender"}: ${m.content}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `Evaluate the student's defense of their position in this Devil's Advocate debate. Score each dimension from 0 to 1 (two decimal places).

Dimensions:
1. reasoning (0-1): How logical and well-structured are the student's arguments?
2. evidence (0-1): Does the student support claims with evidence, examples, or data?
3. counterPoints (0-1): How well does the student address and respond to counter-arguments?

Also provide brief (2-3 sentence) constructive feedback.

Respond ONLY in valid JSON:
{
  "reasoning": 0.0,
  "evidence": 0.0,
  "counterPoints": 0.0,
  "feedback": "string"
}`,
    },
    {
      role: "user",
      content: `Original claim being defended: "${originalClaim}"

Debate:
${historyText}

Evaluate the defender's performance.`,
    },
  ];
}
