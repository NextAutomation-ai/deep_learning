import type { AIMessage } from "../types";

export function buildWhatIfPrompt(
  scenario: string,
  sourceContext: string,
  concepts: { name: string; definition: string }[],
  conversationHistory: { role: "user" | "ai"; content: string }[]
): AIMessage[] {
  const conceptList = concepts
    .slice(0, 15)
    .map((c) => `- ${c.name}: ${c.definition}`)
    .join("\n");

  const systemPrompt = `You are a thought experiment facilitator helping a student explore hypothetical scenarios based on source material. Your role is to:

1. **Explore consequences**: Think through second-order and third-order effects of the hypothetical.
2. **Connect to source**: Reference concepts and ideas from the source material to ground your analysis.
3. **Consider multiple angles**: Look at the scenario from different perspectives — social, economic, scientific, ethical, etc.
4. **Be specific**: Give concrete examples and scenarios rather than vague generalities.
5. **Encourage deeper thinking**: End with a thought-provoking follow-up question.

Format your response in markdown with clear sections.

KEY CONCEPTS:
${conceptList}

SOURCE CONTEXT:
${sourceContext}`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: scenario });

  return messages;
}
