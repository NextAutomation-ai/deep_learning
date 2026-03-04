import { db } from "@/lib/db";
import { userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkBadges, awardBadges } from "./badge-engine";

/**
 * Updates the user's streak based on lastActivityDate vs today.
 * - Same day: no change (already counted)
 * - Yesterday: increment streak
 * - Older or null: reset streak to 1
 * Also updates longestStreak and fires streak badge checks.
 */
export async function updateStreak(userId: string): Promise<void> {
  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  if (!stats) return;

  const today = new Date().toISOString().split("T")[0];
  const lastDate = stats.lastActivityDate;

  if (lastDate === today) {
    // Already tracked today — no streak change needed
    return;
  }

  let newStreak: number;

  if (lastDate) {
    const last = new Date(lastDate);
    const now = new Date(today);
    const diffMs = now.getTime() - last.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day — increment
      newStreak = (stats.currentStreak ?? 0) + 1;
    } else {
      // Gap — reset
      newStreak = 1;
    }
  } else {
    // First activity ever
    newStreak = 1;
  }

  const newLongest = Math.max(stats.longestStreak ?? 0, newStreak);

  await db.update(userStats)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userStats.id, stats.id));

  // Check for streak milestone badges
  const newBadges = await checkBadges(userId, "streak_updated");
  await awardBadges(userId, newBadges);
}
