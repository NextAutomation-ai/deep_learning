import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { userStats, userProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getLevelInfo } from "@/lib/learning/xp";

export async function GET() {
  const session = await getUser();

  let stats = (await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, session.user.id))
    .limit(1))[0];

  if (!stats) {
    // Create default stats
    stats = (await db
      .insert(userStats)
      .values({
        userId: session.user.id,
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalConceptsMastered: 0,
        totalQuizzesCompleted: 0,
        totalTimeSpentMinutes: 0,
        badges: [],
        achievements: [],
      })
      .returning())[0];
  }

  // Count mastered concepts (mastery >= 0.8)
  const progressRows = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, session.user.id));

  const conceptsMastered = progressRows.filter(
    (p) => (p.masteryLevel ?? 0) >= 0.8
  ).length;

  // Update mastered count if changed
  if (conceptsMastered !== stats.totalConceptsMastered) {
    await db.update(userStats)
      .set({ totalConceptsMastered: conceptsMastered })
      .where(eq(userStats.id, stats.id));
    stats = { ...stats, totalConceptsMastered: conceptsMastered };
  }

  const levelInfo = getLevelInfo(stats.totalXp ?? 0);

  return NextResponse.json({
    ...stats,
    levelInfo,
  });
}
