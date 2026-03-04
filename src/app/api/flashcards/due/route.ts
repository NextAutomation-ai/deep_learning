import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents, flashcards, userProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getUser();

  // Get all content IDs for user
  const userContentRows = await db
    .select({ id: contents.id })
    .from(contents)
    .where(eq(contents.userId, session.user.id));
  const userContentIds = userContentRows.map((c) => c.id);

  if (userContentIds.length === 0) {
    return NextResponse.json({ dueCount: 0, totalCount: 0 });
  }

  // Get all flashcards for user's content
  const allFlashcards = await db.select().from(flashcards);
  const userFlashcards = allFlashcards.filter((f) =>
    userContentIds.includes(f.contentId)
  );

  // Get all progress rows for user
  const progressRows = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, session.user.id));

  const progressMap = new Map(
    progressRows.map((p) => [p.conceptId, p])
  );

  const now = new Date();
  let dueCount = 0;

  for (const card of userFlashcards) {
    if (!card.conceptId) {
      dueCount++; // No progress tracking = always due
      continue;
    }
    const progress = progressMap.get(card.conceptId);
    if (!progress || !progress.nextReviewAt) {
      dueCount++; // New card, never reviewed
    } else if (new Date(progress.nextReviewAt) <= now) {
      dueCount++; // Due for review
    }
  }

  return NextResponse.json({
    dueCount,
    totalCount: userFlashcards.length,
  });
}
