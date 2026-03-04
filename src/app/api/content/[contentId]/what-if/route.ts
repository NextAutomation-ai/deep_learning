import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { contentChunks, concepts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiComplete } from "@/lib/ai/router";
import { buildWhatIfPrompt } from "@/lib/ai/prompts/what-if-scenarios";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await getUser();
    const { contentId } = await params;
    if (!(await verifyContentOwnership(contentId, session.user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const { scenario, conversationHistory } = body as {
      scenario: string;
      conversationHistory: { role: "user" | "ai"; content: string }[];
    };

    if (!scenario?.trim()) {
      return NextResponse.json(
        { error: "Scenario is required" },
        { status: 400 }
      );
    }

    // Load chunks for context (first 5 for token budget)
    const chunks = await db
      .select()
      .from(contentChunks)
      .where(eq(contentChunks.contentId, contentId));

    const sourceContext = chunks
      .slice(0, 5)
      .map((c) => c.text)
      .join("\n\n");

    const allConcepts = await db
      .select()
      .from(concepts)
      .where(eq(concepts.contentId, contentId));

    const messages = buildWhatIfPrompt(
      scenario,
      sourceContext,
      allConcepts.map((c) => ({ name: c.name, definition: c.definition })),
      conversationHistory || []
    );

    const response = await aiComplete({
      messages,
      taskType: "what_if_scenarios",
    });

    return NextResponse.json({
      response: response.content.trim(),
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
