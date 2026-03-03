import OpenAI from "openai";
import type {
  AIProviderClient,
  AICompletionRequest,
  AICompletionResponse,
} from "../types";

function getClient() {
  return new OpenAI({
    baseURL: "https://api.x.ai/v1",
    apiKey: process.env.XAI_API_KEY,
  });
}

export const grokProvider: AIProviderClient = {
  id: "grok",

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const client = getClient();
    const model = request.model || "grok-3";

    const response = await client.chat.completions.create({
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      model: response.model || model,
      provider: "grok",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      cached: false,
    };
  },

  isAvailable(): boolean {
    return !!process.env.XAI_API_KEY;
  },
};
