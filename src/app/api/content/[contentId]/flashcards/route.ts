import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { flashcards, userProgress } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;

  const allFlashcards = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.contentId, contentId));

  // Get user progress for SM-2 state
  const progressRows = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.contentId, contentId),
        eq(userProgress.userId, session.user.id)
      )
    );

  const progressMap = new Map(progressRows.map((p) => [p.conceptId, p]));
  const now = Date.now();

  const cardsWithState = allFlashcards.map((card) => {
    const progress = card.conceptId ? progressMap.get(card.conceptId) : null;
    const nextReview = progress?.nextReviewAt
      ? new Date(progress.nextReviewAt).getTime()
      : 0;
    const isDue = !progress || nextReview <= now;

    return {
      ...card,
      sm2State: progress
        ? {
            easeFactor: progress.easeFactor,
            intervalDays: progress.intervalDays,
            repetitions: progress.streak,
            lastReviewedAt: progress.lastReviewedAt,
            nextReviewAt: progress.nextReviewAt,
            masteryLevel: progress.masteryLevel,
          }
        : null,
      isDue,
    };
  });

  // Sort: due cards first, then new cards (no progress), then reviewed
  cardsWithState.sort((a, b) => {
    if (a.isDue && !b.isDue) return -1;
    if (!a.isDue && b.isDue) return 1;
    if (!a.sm2State && b.sm2State) return -1;
    if (a.sm2State && !b.sm2State) return 1;
    return 0;
  });

  const dueCount = cardsWithState.filter((c) => c.isDue).length;

  return NextResponse.json({
    flashcards: cardsWithState,
    total: cardsWithState.length,
    dueCount,
  });
}
