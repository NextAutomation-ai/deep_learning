import { selectModelForTask, getProvider, getCandidatesForTask } from "./providers";
import { checkRateLimit, waitForRateLimit } from "./rate-limiter";
import {
  getCachedResponse,
  setCachedResponse,
  computeContentHash,
  computePromptHash,
} from "./cache";
import { safeJsonParse } from "@/lib/utils/errors";
import type {
  AICompletionRequest,
  AICompletionResponse,
  AITaskType,
} from "./types";

export async function aiComplete(
  request: AICompletionRequest
): Promise<AICompletionResponse> {
  let provider = request.provider;
  let model = request.model;

  // 1. Auto-select model based on task type if not specified
  if (!provider || !model) {
    const selected = selectModelForTask(request.taskType || "general");
    if (!selected) {
      throw new Error(
        "No AI provider available. Please configure at least one API key."
      );
    }
    provider = provider || selected.provider;
    model = model || selected.model;
  }

  // 2. Check cache
  const taskType = request.taskType || "general";
  const contentHash = computeContentHash(
    request.messages.map((m) => m.content).join("")
  );
  const promptHash = computePromptHash(request.messages);

  const cached = await getCachedResponse(taskType, contentHash, promptHash);
  if (cached) {
    return {
      content: typeof cached === "string" ? cached : JSON.stringify(cached),
      model: model!,
      provider: provider!,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      cached: true,
    };
  }

  // 3. Rate limit check with wait
  if (!checkRateLimit(provider!)) {
    await waitForRateLimit(provider!);
  }

  // 4. Execute with fallback — use task-specific candidates from TASK_MODEL_MAP
  let lastError: Error | null = null;
  const taskCandidates = getCandidatesForTask(
    (request.taskType || "general") as AITaskType
  );
  // Build candidate list: primary choice first, then all task-specific fallbacks (deduplicated)
  const primary = { provider: provider!, model: model! };
  const seen = new Set<string>();
  seen.add(`${primary.provider}/${primary.model}`);
  const candidates = [primary];
  for (const c of taskCandidates) {
    const key = `${c.provider}/${c.model}`;
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push(c);
    }
  }

  for (const candidate of candidates) {
    try {
      const client = getProvider(candidate.provider);
      if (!client.isAvailable()) continue;
      if (!checkRateLimit(candidate.provider)) continue;

      const response = await client.complete({
        ...request,
        model: candidate.model,
        provider: candidate.provider,
      });

      // 5. Cache the response
      await setCachedResponse(
        taskType,
        contentHash,
        promptHash,
        candidate.model,
        response.content
      );

      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `AI provider ${candidate.provider}/${candidate.model} failed:`,
        error
      );
      continue;
    }
  }

  throw lastError || new Error("All AI providers failed");
}

/**
 * Helper to make an AI call and parse JSON response
 */
export async function aiCompleteJson<T>(
  request: AICompletionRequest
): Promise<T> {
  const response = await aiComplete({
    ...request,
    responseFormat: "json",
  });

  const parsed = safeJsonParse<T>(response.content);
  if (parsed === null) {
    throw new Error(`Failed to parse AI response as JSON: ${response.content.slice(0, 200)}`);
  }
  return parsed;
}
