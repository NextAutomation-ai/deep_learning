import { db } from "@/lib/db";
import { aiCache } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { createHash } from "crypto";

function hashString(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function getCachedResponse(
  task: string,
  contentHash: string,
  promptHash: string
): Promise<unknown | null> {
  try {
    const cached = await db
      .select()
      .from(aiCache)
      .where(
        and(
          eq(aiCache.task, task),
          eq(aiCache.contentHash, contentHash),
          eq(aiCache.promptHash, promptHash)
        )
      )
      .limit(1);

    if (cached.length > 0) {
      return cached[0].result;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  task: string,
  contentHash: string,
  promptHash: string,
  model: string,
  result: unknown
): Promise<void> {
  try {
    await db.insert(aiCache)
      .values({
        task,
        contentHash,
        promptHash,
        modelUsed: model,
        result: result as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: [aiCache.task, aiCache.contentHash, aiCache.promptHash],
        set: {
          modelUsed: model,
          result: result as Record<string, unknown>,
          createdAt: new Date(),
        },
      });
  } catch {
    // Cache write failures are non-critical
  }
}

export function computeContentHash(text: string): string {
  return hashString(text);
}

export function computePromptHash(messages: { role: string; content: string }[]): string {
  return hashString(JSON.stringify(messages));
}
