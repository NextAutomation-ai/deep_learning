import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contentChunks, concepts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiComplete } from "@/lib/ai/router";
import { buildDeepDiveQAPrompt } from "@/lib/ai/prompts/deep-dive-qa";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    await getUser();
    const { contentId } = await params;
    const body = await request.json();
    const { question, conversationHistory } = body as {
      question: string;
      conversationHistory: { role: "user" | "ai"; content: string }[];
    };

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Load chunks
    const chunks = db
      .select()
      .from(contentChunks)
      .where(eq(contentChunks.contentId, contentId))
      .all();

    // Load concepts
    const allConcepts = db
      .select()
      .from(concepts)
      .where(eq(concepts.contentId, contentId))
      .all();

    // Simple keyword relevance: score each chunk by question word overlap
    const questionWords = question
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const scoredChunks = chunks.map((chunk) => {
      const text = chunk.text.toLowerCase();
      const score = questionWords.reduce(
        (acc, word) => acc + (text.includes(word) ? 1 : 0),
        0
      );
      return { ...chunk, relevanceScore: score };
    });

    // Take top 6 most relevant chunks (or all if fewer)
    const relevantChunks = scoredChunks
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6);

    const messages = buildDeepDiveQAPrompt(
      question,
      relevantChunks.map((c) => ({
        chapterTitle: c.chapterTitle,
        text: c.text,
      })),
      allConcepts.map((c) => ({ name: c.name, definition: c.definition })),
      conversationHistory || []
    );

    const response = await aiComplete({
      messages,
      taskType: "deep_dive_qa",
    });

    return NextResponse.json({
      answer: response.content.trim(),
      model: response.model,
      cached: response.cached,
    });
  } catch {
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
