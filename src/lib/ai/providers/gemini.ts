import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AIProviderClient,
  AICompletionRequest,
  AICompletionResponse,
} from "../types";

function getClient() {
  return new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
  );
}

export const geminiProvider: AIProviderClient = {
  id: "gemini",

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const client = getClient();
    const modelId = request.model || "gemini-2.0-flash";
    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 1500,
        ...(request.responseFormat === "json"
          ? { responseMimeType: "application/json" }
          : {}),
      },
    });

    const systemPrompt =
      request.messages.find((m) => m.role === "system")?.content || "";
    const userMessages = request.messages.filter((m) => m.role !== "system");
    const prompt = systemPrompt
      ? `${systemPrompt}\n\n${userMessages.map((m) => m.content).join("\n")}`
      : userMessages.map((m) => m.content).join("\n");

    const result = await model.generateContent(prompt);
    const response = result.response;

    return {
      content: response.text(),
      model: modelId,
      provider: "gemini",
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
      cached: false,
    };
  },

  isAvailable(): boolean {
    return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  },
};
