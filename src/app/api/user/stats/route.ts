import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { userStats, userProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getLevelInfo } from "@/lib/learning/xp";

export async function GET() {
  const session = await getUser();

  let stats = db
    .select()
    .from(userStats)
    .all()
    .find((s) => s.userId === session.user.id);

  if (!stats) {
    // Create default stats
    stats = db
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
      .returning()
      .get();
  }

  // Count mastered concepts (mastery >= 0.8)
  const progressRows = db
    .select()
    .from(userProgress)
    .all()
    .filter((p) => p.userId === session.user.id);

  const conceptsMastered = progressRows.filter(
    (p) => (p.masteryLevel ?? 0) >= 0.8
  ).length;

  // Update mastered count if changed
  if (conceptsMastered !== stats.totalConceptsMastered) {
    db.update(userStats)
      .set({ totalConceptsMastered: conceptsMastered })
      .where(eq(userStats.id, stats.id))
      .run();
    stats = { ...stats, totalConceptsMastered: conceptsMastered };
  }

  const levelInfo = getLevelInfo(stats.totalXp ?? 0);

  return NextResponse.json({
    ...stats,
    levelInfo,
  });
}
