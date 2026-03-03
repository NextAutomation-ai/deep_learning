import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { learningSessions, userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateGameXp } from "@/lib/gamification/game-helpers";
import { calculateStreakBonus } from "@/lib/gamification/streak";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";
import { updateStreak } from "@/lib/gamification/update-streak";
import { getLevelInfo } from "@/lib/learning/xp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;
  const body = await request.json();
  const { score, maxScore, correct, total } = body as {
    score: number;
    maxScore: number;
    correct: number;
    total: number;
  };

  const xpEarned = calculateGameXp("concept_clash", score, maxScore);
  const streakBonus = calculateStreakBonus(
    (
      db
        .select()
        .from(userStats)
        .all()
        .find((s) => s.userId === session.user.id)
    )?.currentStreak ?? 0
  );

  const totalXp = xpEarned + streakBonus;

  // Record game session
  db.insert(learningSessions)
    .values({
      userId: session.user.id,
      contentId,
      sessionType: "game",
      xpEarned: totalXp,
      conceptsCovered: {
        gameType: "concept_clash",
        scorePercent: maxScore > 0 ? score / maxScore : 0,
        won: correct === total,
      } as unknown as string[],
    })
    .run();

  // Update user stats XP
  const stats = db
    .select()
    .from(userStats)
    .all()
    .find((s) => s.userId === session.user.id);

  if (stats) {
    const newTotalXp = (stats.totalXp ?? 0) + totalXp;
    const levelInfo = getLevelInfo(newTotalXp);
    db.update(userStats)
      .set({
        totalXp: newTotalXp,
        level: levelInfo.level,
        updatedAt: new Date(),
      })
      .where(eq(userStats.id, stats.id))
      .run();
  }

  // Update streak and check badges
  updateStreak(session.user.id);
  const newBadges = checkBadges(session.user.id, "game_completed");
  awardBadges(session.user.id, newBadges);

  return NextResponse.json({
    gameType: "concept_clash",
    score,
    maxScore,
    correct,
    total,
    xpEarned,
    streakBonus,
    totalXp,
    newBadges,
  });
}
