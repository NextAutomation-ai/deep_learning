export const maxDuration = 30;

import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/providers";
import type { AIProviderType } from "@/lib/ai/types";

const TEST_PROVIDERS: { provider: AIProviderType; model: string }[] = [
  { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  { provider: "openrouter", model: "deepseek/deepseek-chat" },
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "grok", model: "grok-3" },
];

export async function GET() {
  const results = await Promise.all(
    TEST_PROVIDERS.map(async ({ provider, model }) => {
      const client = getProvider(provider);

      if (!client.isAvailable()) {
        return {
          provider,
          model,
          status: "unavailable",
          error: "API key not configured",
        };
      }

      try {
        const response = await client.complete({
          messages: [
            { role: "user", content: "Say hello in one word. Reply with just one word." },
          ],
          model,
          provider,
          temperature: 0,
          maxTokens: 10,
        });

        return {
          provider,
          model,
          status: "ok",
          response: response.content.slice(0, 50),
        };
      } catch (error) {
        return {
          provider,
          model,
          status: "error",
          error: error instanceof Error ? error.message.slice(0, 200) : "Unknown error",
        };
      }
    })
  );

  const anyWorking = results.some((r) => r.status === "ok");

  return NextResponse.json({
    summary: anyWorking ? "At least one provider is working" : "ALL PROVIDERS FAILING",
    providers: results,
  });
}
