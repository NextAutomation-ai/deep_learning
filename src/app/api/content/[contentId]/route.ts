import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents, contentChunks, concepts, questions, flashcards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();

  const { contentId } = await params;

  const content = db
    .select()
    .from(contents)
    .where(
      and(eq(contents.id, contentId), eq(contents.userId, session.user.id))
    )
    .get();

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conceptCount = db
    .select()
    .from(concepts)
    .where(eq(concepts.contentId, contentId))
    .all().length;

  const questionCount = db
    .select()
    .from(questions)
    .where(eq(questions.contentId, contentId))
    .all().length;

  const flashcardCount = db
    .select()
    .from(flashcards)
    .where(eq(flashcards.contentId, contentId))
    .all().length;

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

  const content = db
    .select()
    .from(contents)
    .where(
      and(eq(contents.id, contentId), eq(contents.userId, session.user.id))
    )
    .get();

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CASCADE delete handles related records
  db.delete(contents).where(eq(contents.id, contentId)).run();

  return NextResponse.json({ success: true });
}
