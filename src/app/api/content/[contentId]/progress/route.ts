import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { concepts, userProgress, quizAttempts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;

  const allConcepts = await db
    .select()
    .from(concepts)
    .where(eq(concepts.contentId, contentId));

  const progressRows = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.contentId, contentId),
        eq(userProgress.userId, session.user.id)
      )
    );

  const quizzes = await db
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.contentId, contentId),
        eq(quizAttempts.userId, session.user.id)
      )
    );

  // Overall mastery
  const totalMastery =
    progressRows.length > 0
      ? progressRows.reduce((sum, p) => sum + (p.masteryLevel ?? 0), 0) /
        allConcepts.length
      : 0;

  // Concepts mastered (>= 0.8)
  const conceptsMastered = progressRows.filter(
    (p) => (p.masteryLevel ?? 0) >= 0.8
  ).length;

  // Bloom's distribution
  const bloomsLevels = [
    "remember",
    "understand",
    "apply",
    "analyze",
    "evaluate",
    "create",
  ];
  const bloomsDistribution: Record<string, number> = {};
  for (const level of bloomsLevels) {
    bloomsDistribution[level] = progressRows.filter(
      (p) => p.bloomsAchieved === level
    ).length;
  }

  // Quiz stats
  const totalQuizzes = quizzes.length;
  const avgScore =
    quizzes.length > 0
      ? quizzes.reduce(
          (sum, q) =>
            sum +
            ((q.score ?? 0) / Math.max(q.maxScore ?? 1, 1)) * 100,
          0
        ) / quizzes.length
      : 0;

  // Flashcards due
  const now = Date.now();
  const flashcardsDue = progressRows.filter((p) => {
    if (!p.nextReviewAt) return true;
    return new Date(p.nextReviewAt).getTime() <= now;
  }).length;

  return NextResponse.json({
    totalConcepts: allConcepts.length,
    conceptsStarted: progressRows.length,
    conceptsMastered,
    overallMastery: Math.round(totalMastery * 100) / 100,
    bloomsDistribution,
    totalQuizzes,
    avgQuizScore: Math.round(avgScore),
    flashcardsDue,
  });
}
