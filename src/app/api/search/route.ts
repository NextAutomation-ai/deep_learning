import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents, concepts, flashcards } from "@/lib/db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getUser();
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ contents: [], concepts: [], flashcards: [] });
  }

  const pattern = `%${q}%`;

  // Search contents (title, description) — only completed
  const matchedContents = db
    .select({
      id: contents.id,
      title: contents.title,
      sourceType: contents.sourceType,
      processingStatus: contents.processingStatus,
    })
    .from(contents)
    .where(
      and(
        eq(contents.userId, session.user.id),
        eq(contents.processingStatus, "completed"),
        or(like(contents.title, pattern), like(contents.description, pattern))
      )
    )
    .orderBy(desc(contents.updatedAt))
    .limit(5)
    .all();

  // Get user's content IDs for scoping concept/flashcard searches
  const userContentIds = db
    .select({ id: contents.id })
    .from(contents)
    .where(eq(contents.userId, session.user.id))
    .all()
    .map((c) => c.id);

  if (userContentIds.length === 0) {
    return NextResponse.json({
      contents: matchedContents,
      concepts: [],
      flashcards: [],
    });
  }

  // Search concepts (name, definition)
  const allConcepts = db
    .select({
      id: concepts.id,
      contentId: concepts.contentId,
      name: concepts.name,
      definition: concepts.definition,
    })
    .from(concepts)
    .where(or(like(concepts.name, pattern), like(concepts.definition, pattern)))
    .limit(50)
    .all();

  const matchedConcepts = allConcepts
    .filter((c) => userContentIds.includes(c.contentId))
    .slice(0, 5);

  // Search flashcards (frontText)
  const allFlashcards = db
    .select({
      id: flashcards.id,
      contentId: flashcards.contentId,
      frontText: flashcards.frontText,
    })
    .from(flashcards)
    .where(like(flashcards.frontText, pattern))
    .limit(50)
    .all();

  const matchedFlashcards = allFlashcards
    .filter((f) => userContentIds.includes(f.contentId))
    .slice(0, 5);

  return NextResponse.json({
    contents: matchedContents,
    concepts: matchedConcepts,
    flashcards: matchedFlashcards,
  });
}
