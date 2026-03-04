import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { userProgress, userStats } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateSM2, defaultSM2State } from "@/lib/learning/sm2";
import type { SM2Rating } from "@/lib/learning/sm2";
import { getLevelInfo, XP_REWARDS } from "@/lib/learning/xp";
import { updateStreak } from "@/lib/gamification/update-streak";

export async function POST(request: NextRequest) {
  const session = await getUser();
  const body = await request.json();
  const { flashcardId, contentId, conceptId, rating } = body as {
    flashcardId: string;
    contentId: string;
    conceptId: string;
    rating: SM2Rating;
  };

  if (![1, 3, 4, 5].includes(rating)) {
    return NextResponse.json(
      { error: "Rating must be 1, 3, 4, or 5" },
      { status: 400 }
    );
  }

  // Get or create user progress for this concept
  const existing = (await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, session.user.id),
        eq(userProgress.contentId, contentId),
        eq(userProgress.conceptId, conceptId)
      )
    )
    .limit(1))[0];

  const currentState = existing
    ? {
        easeFactor: existing.easeFactor ?? 2.5,
        intervalDays: existing.intervalDays ?? 1,
        repetitions: existing.streak ?? 0,
      }
    : defaultSM2State();

  const result = calculateSM2(currentState, rating);
  const isCorrect = rating >= 3;
  const timesReviewed = (existing?.timesReviewed ?? 0) + 1;
  const timesCorrect = (existing?.timesCorrect ?? 0) + (isCorrect ? 1 : 0);
  const newMastery = timesCorrect / timesReviewed;

  if (existing) {
    await db.update(userProgress)
      .set({
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        streak: result.repetitions,
        nextReviewAt: result.nextReviewAt,
        lastReviewedAt: new Date(),
        masteryLevel: Math.round(newMastery * 100) / 100,
        timesReviewed,
        timesCorrect,
        timesIncorrect: (existing.timesIncorrect ?? 0) + (isCorrect ? 0 : 1),
        updatedAt: new Date(),
      })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress)
      .values({
        userId: session.user.id,
        contentId,
        conceptId,
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        streak: result.repetitions,
        nextReviewAt: result.nextReviewAt,
        lastReviewedAt: new Date(),
        masteryLevel: isCorrect ? 1 : 0,
        timesReviewed: 1,
        timesCorrect: isCorrect ? 1 : 0,
        timesIncorrect: isCorrect ? 0 : 1,
      });
  }

  // Award XP for review
  const xp = XP_REWARDS.flashcard_review;
  await updateUserStats(session.user.id, xp);
  await updateStreak(session.user.id);

  return NextResponse.json({
    nextReviewAt: result.nextReviewAt,
    easeFactor: result.easeFactor,
    intervalDays: result.intervalDays,
    newMastery: Math.round(newMastery * 100) / 100,
    xpEarned: xp,
  });
}

async function updateUserStats(userId: string, xpEarned: number) {
  const existing = (await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1))[0];

  if (existing) {
    const newXp = (existing.totalXp ?? 0) + xpEarned;
    const levelInfo = getLevelInfo(newXp);
    await db.update(userStats)
      .set({
        totalXp: newXp,
        level: levelInfo.level,
        updatedAt: new Date(),
      })
      .where(eq(userStats.id, existing.id));
  } else {
    await db.insert(userStats)
      .values({
        userId,
        totalXp: xpEarned,
        level: 1,
      });
  }
}
