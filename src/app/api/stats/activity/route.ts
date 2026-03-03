import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { learningSessions, userStats } from "@/lib/db/schema";
import { getNextMilestone } from "@/lib/gamification/streak";

export async function GET() {
  const session = await getUser();

  const stats = db
    .select()
    .from(userStats)
    .all()
    .find((s) => s.userId === session.user.id);

  // Get last 90 days of sessions for heatmap
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const sessions = db
    .select()
    .from(learningSessions)
    .all()
    .filter(
      (s) =>
        s.userId === session.user.id &&
        s.startedAt &&
        s.startedAt.getTime() > ninetyDaysAgo
    );

  // Build heatmap data: { date: "YYYY-MM-DD", count: number, xp: number }
  const heatmap: Record<string, { count: number; xp: number }> = {};
  for (const s of sessions) {
    if (!s.startedAt) continue;
    const date = s.startedAt.toISOString().slice(0, 10);
    if (!heatmap[date]) heatmap[date] = { count: 0, xp: 0 };
    heatmap[date].count++;
    heatmap[date].xp += s.xpEarned ?? 0;
  }

  const heatmapData = Object.entries(heatmap).map(([date, data]) => ({
    date,
    ...data,
  }));

  // Weekly XP data
  const weeklyXp = (stats?.weeklyXp as Record<string, number>) || {};

  // Session type breakdown
  const typeCounts: Record<string, number> = {};
  for (const s of sessions) {
    const type = s.sessionType || "other";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  const streakInfo = getNextMilestone(stats?.currentStreak ?? 0);

  return NextResponse.json({
    heatmap: heatmapData,
    weeklyXp,
    sessionTypes: typeCounts,
    streak: {
      current: stats?.currentStreak ?? 0,
      longest: stats?.longestStreak ?? 0,
      ...streakInfo,
    },
    totalSessions: sessions.length,
  });
}
