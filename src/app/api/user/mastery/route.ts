import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents, concepts, userProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getUser();
  const userId = session.user.id;

  // Get user content IDs
  const userContentRows = await db
    .select({ id: contents.id })
    .from(contents)
    .where(eq(contents.userId, userId));
  const userContentIds = userContentRows.map((c) => c.id);

  if (userContentIds.length === 0) {
    return NextResponse.json({
      mastery: { notStarted: 0, learning: 0, practicing: 0, mastered: 0 },
    });
  }

  // Get total concept count for user's content
  const allConcepts = await db.select({ id: concepts.id, contentId: concepts.contentId }).from(concepts);
  const userConcepts = allConcepts.filter((c) =>
    userContentIds.includes(c.contentId)
  );
  const totalConcepts = userConcepts.length;

  // Get progress rows
  const progressRows = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  let learning = 0;
  let practicing = 0;
  let mastered = 0;

  for (const p of progressRows) {
    const level = p.masteryLevel ?? 0;
    if (level >= 0.8) mastered++;
    else if (level >= 0.4) practicing++;
    else if (level > 0) learning++;
  }

  const notStarted = Math.max(0, totalConcepts - learning - practicing - mastered);

  return NextResponse.json({
    mastery: { notStarted, learning, practicing, mastered },
  });
}
