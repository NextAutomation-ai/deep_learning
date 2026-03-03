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
  const { correct, total, timeTaken } = body as {
    correct: number;
    total: number;
    timeTaken: number;
  };

  const xpEarned = calculateGameXp("connection", correct, total);
  const stats = db
    .select()
    .from(userStats)
    .all()
    .find((s) => s.userId === session.user.id);

  const streakBonus = calculateStreakBonus(stats?.currentStreak ?? 0);
  const totalXp = xpEarned + streakBonus;
  const won = correct === total;

  // Record game session
  db.insert(learningSessions)
    .values({
      userId: session.user.id,
      contentId,
      sessionType: "game",
      durationMinutes: Math.ceil(timeTaken / 60),
      xpEarned: totalXp,
      conceptsCovered: {
        gameType: "connection",
        won,
      } as unknown as string[],
    })
    .run();

  // Update XP
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

  updateStreak(session.user.id);
  const newBadges = checkBadges(session.user.id, "game_completed");
  awardBadges(session.user.id, newBadges);

  return NextResponse.json({
    gameType: "connection",
    correct,
    total,
    won,
    xpEarned,
    streakBonus,
    totalXp,
    newBadges,
  });
}
