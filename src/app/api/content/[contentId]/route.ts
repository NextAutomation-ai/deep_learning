import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents, contentChunks, concepts, questions, flashcards, userProgress, quizAttempts, learningSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();

  const { contentId } = await params;

  const content = (await db
    .select()
    .from(contents)
    .where(
      and(eq(contents.id, contentId), eq(contents.userId, session.user.id))
    )
    .limit(1))[0];

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conceptCount = (await db
    .select()
    .from(concepts)
    .where(eq(concepts.contentId, contentId))).length;

  const questionCount = (await db
    .select()
    .from(questions)
    .where(eq(questions.contentId, contentId))).length;

  const flashcardCount = (await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.contentId, contentId))).length;

  return NextResponse.json({
    content,
    stats: {
      concepts: conceptCount,
      questions: questionCount,
      flashcards: flashcardCount,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();

  const { contentId } = await params;

  const content = (await db
    .select()
    .from(contents)
    .where(
      and(eq(contents.id, contentId), eq(contents.userId, session.user.id))
    )
    .limit(1))[0];

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from tables without cascade before deleting content
  await db.delete(userProgress).where(eq(userProgress.contentId, contentId));
  await db.delete(quizAttempts).where(eq(quizAttempts.contentId, contentId));
  await db.delete(learningSessions).where(eq(learningSessions.contentId, contentId));

  // CASCADE delete handles remaining related records (chunks, concepts, questions, flashcards, etc.)
  await db.delete(contents).where(eq(contents.id, contentId));

  return NextResponse.json({ success: true });
}
