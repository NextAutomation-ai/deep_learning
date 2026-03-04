import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { concepts, userProgress } from "@/lib/db/schema";
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

  // Join with user progress
  const progressRows = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.contentId, contentId),
        eq(userProgress.userId, session.user.id)
      )
    );

  const progressMap = new Map(progressRows.map((p) => [p.conceptId, p]));

  const conceptsWithProgress = allConcepts.map((c) => ({
    ...c,
    progress: progressMap.get(c.id) || null,
  }));

  return NextResponse.json({ concepts: conceptsWithProgress });
}
