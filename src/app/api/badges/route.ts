import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { userStats } from "@/lib/db/schema";
import { BADGES, BADGE_MAP } from "@/lib/gamification/badges";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getUser();

  const stats = (await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, session.user.id))
    .limit(1))[0];

  const earnedIds = (stats?.badges as string[]) || [];

  const badges = BADGES.map((badge) => ({
    ...badge,
    earned: earnedIds.includes(badge.id),
    earnedAt: earnedIds.includes(badge.id) ? stats?.updatedAt : null,
  }));

  return NextResponse.json({
    badges,
    totalEarned: earnedIds.length,
    totalAvailable: BADGES.length,
  });
}
