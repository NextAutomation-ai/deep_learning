import OpenAI from "openai";
import type {
  AIProviderClient,
  AICompletionRequest,
  AICompletionResponse,
} from "../types";

function getClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "DeepLearn",
    },
  });
}

export const openrouterProvider: AIProviderClient = {
  id: "openrouter",

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const client = getClient();
    const model = request.model || "deepseek/deepseek-chat";

    const response = await client.chat.completions.create({
      model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1500,
      ...(request.responseFormat === "json"
        ? { response_format: { type: "json_object" } }
        : {}),
    });

    return {
      content: response.choices[0]?.message?.content || "",
      model: response.model || model,
      provider: "openrouter",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      cached: false,
    };
  },

  isAvailable(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  },
};
