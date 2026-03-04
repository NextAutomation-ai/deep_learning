import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { userProgress, userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE() {
  const session = await getUser();
  const userId = session.user.id;

  // Clear all progress rows
  await db
    .delete(userProgress)
    .where(eq(userProgress.userId, userId));

  // Reset stats
  await db.update(userStats)
    .set({
      totalConceptsMastered: 0,
      totalQuizzesCompleted: 0,
      totalTimeSpentMinutes: 0,
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));

  return NextResponse.json({
    success: true,
  });
}
