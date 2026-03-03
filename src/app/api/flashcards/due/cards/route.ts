import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents, flashcards, userProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getUser();

  // Get all content for user (with titles)
  const userContents = db
    .select({ id: contents.id, title: contents.title })
    .from(contents)
    .where(eq(contents.userId, session.user.id))
    .all();

  const contentMap = new Map(userContents.map((c) => [c.id, c.title]));
  const contentIds = userContents.map((c) => c.id);

  if (contentIds.length === 0) {
    return NextResponse.json({ flashcards: [] });
  }

  // Get all flashcards for user's content
  const allFlashcards = db.select().from(flashcards).all();
  const userFlashcards = allFlashcards.filter((f) =>
    contentIds.includes(f.contentId)
  );

  // Get all progress rows for user
  const progressRows = db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, session.user.id))
    .all();

  const progressMap = new Map(
    progressRows.map((p) => [p.conceptId, p])
  );

  const now = new Date();
  const dueCards: Array<{
    id: string;
    contentId: string;
    conceptId: string | null;
    frontText: string;
    backText: string;
    difficultyLevel: number | null;
    contentTitle: string;
    isDue: boolean;
    sm2State: {
      easeFactor: number | null;
      intervalDays: number | null;
      repetitions: number | null;
      masteryLevel: number | null;
    } | null;
  }> = [];

  for (const card of userFlashcards) {
    const progress = card.conceptId
      ? progressMap.get(card.conceptId)
      : null;
    const isDue =
      !progress ||
      !progress.nextReviewAt ||
      new Date(progress.nextReviewAt) <= now;

    if (!isDue) continue;

    dueCards.push({
      id: card.id,
      contentId: card.contentId,
      conceptId: card.conceptId,
      frontText: card.frontText,
      backText: card.backText,
      difficultyLevel: card.difficultyLevel,
      contentTitle: contentMap.get(card.contentId) || "Unknown",
      isDue: true,
      sm2State: progress
        ? {
            easeFactor: progress.easeFactor,
            intervalDays: progress.intervalDays,
            repetitions: progress.timesReviewed,
            masteryLevel: progress.masteryLevel,
          }
        : null,
    });
  }

  // Sort: new cards first (no sm2State), then by nextReviewAt ascending
  dueCards.sort((a, b) => {
    if (!a.sm2State && b.sm2State) return -1;
    if (a.sm2State && !b.sm2State) return 1;
    return 0;
  });

  return NextResponse.json({ flashcards: dueCards.slice(0, 50) });
}
