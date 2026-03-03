import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProviderClient,
  AICompletionRequest,
  AICompletionResponse,
} from "../types";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const claudeProvider: AIProviderClient = {
  id: "claude",

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const client = getClient();
    const modelId = request.model || "claude-sonnet-4-20250514";
    const systemMsg = request.messages.find((m) => m.role === "system");
    const nonSystemMsgs = request.messages.filter((m) => m.role !== "system");

    const response = await client.messages.create({
      model: modelId,
      max_tokens: request.maxTokens ?? 4096,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: nonSystemMsgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === "text");

    return {
      content: textBlock?.text || "",
      model: response.model,
      provider: "claude",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens:
          response.usage.input_tokens + response.usage.output_tokens,
      },
      cached: false,
    };
  },

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  },
};
