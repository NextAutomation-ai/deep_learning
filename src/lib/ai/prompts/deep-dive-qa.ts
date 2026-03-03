import type { AIMessage } from "../types";

export function buildDeepDiveQAPrompt(
  question: string,
  sourceChunks: { chapterTitle: string | null; text: string }[],
  concepts: { name: string; definition: string }[],
  conversationHistory: { role: "user" | "ai"; content: string }[]
): AIMessage[] {
  const sourceContext = sourceChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}${chunk.chapterTitle ? ` - ${chunk.chapterTitle}` : ""}]\n${chunk.text}`
    )
    .join("\n\n");

  const conceptList = concepts
    .slice(0, 20)
    .map((c) => `- ${c.name}: ${c.definition}`)
    .join("\n");

  const historyText = conversationHistory
    .map((m) => `${m.role === "user" ? "Student" : "Teacher"}: ${m.content}`)
    .join("\n\n");

  const systemPrompt = `You are an expert teacher answering questions about specific source material. Your answers must be:

1. **Source-grounded**: Base your answers primarily on the provided source material. Cite relevant sections when possible (e.g., "According to the source...").
2. **Accurate**: If the source doesn't cover something, clearly state "This goes beyond the provided source material" before offering general knowledge.
3. **Clear**: Use simple language, examples, and analogies. Break complex ideas into digestible parts.
4. **Contextual**: Reference related concepts from the material to build connections.

Format your response in markdown. Use bullet points, bold text, and headers where helpful.

KEY CONCEPTS FROM THE SOURCE:
${conceptList}

SOURCE MATERIAL:
${sourceContext}`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  // Add current question
  messages.push({ role: "user", content: question });

  return messages;
}
