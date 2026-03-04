import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { concepts, socraticSessions, learningSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiComplete } from "@/lib/ai/router";
import { buildSocraticQuestionPrompt } from "@/lib/ai/prompts/socratic-questioning";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await getUser();
    const { contentId } = await params;
    const body = await request.json();
    const { conceptId } = body as { conceptId?: string };

    // Get concept — either specified or random from content
    let concept;
    if (conceptId) {
      concept = (await db.select().from(concepts).where(eq(concepts.id, conceptId)).limit(1))[0];
    } else {
      const allConcepts = await db
        .select()
        .from(concepts)
        .where(eq(concepts.contentId, contentId));
      if (allConcepts.length === 0) {
        return NextResponse.json({ error: "No concepts found" }, { status: 404 });
      }
      concept = allConcepts[Math.floor(Math.random() * allConcepts.length)];
    }

    if (!concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    }

    // Generate first Socratic question
    const messages = buildSocraticQuestionPrompt(
      concept.name,
      concept.definition,
      concept.sourceExcerpt || "",
      []
    );

    const response = await aiComplete({
      messages,
      taskType: "socratic_questions",
    });

    const firstQuestion = response.content.trim();
    const now = Date.now();

    // Create session
    const [sessionRow] = await db
      .insert(socraticSessions)
      .values({
        userId: session.user.id,
        contentId,
        conceptId: concept.id,
        status: "active",
        messages: [{ role: "ai" as const, content: firstQuestion, timestamp: now }],
        questionsAsked: 1,
      })
      .returning();

    // Create learning session
    await db.insert(learningSessions)
      .values({
        userId: session.user.id,
        contentId,
        sessionType: "socratic",
        conceptsCovered: [concept.id],
      });

    return NextResponse.json({
      sessionId: sessionRow.id,
      conceptId: concept.id,
      conceptName: concept.name,
      firstQuestion,
    });
  } catch {
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
