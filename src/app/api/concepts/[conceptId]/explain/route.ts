import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { concepts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiComplete } from "@/lib/ai/router";
import { buildExplainConceptPrompt } from "@/lib/ai/prompts/explain-concept";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conceptId: string }> }
) {
  try {
    const { conceptId } = await params;
    const body = await request.json();
    const mode = body.mode as "simpler" | "deeper" | "analogy" | "example";

    if (!["simpler", "deeper", "analogy", "example"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Use: simpler, deeper, analogy, example" },
        { status: 400 }
      );
    }

    const concept = db
      .select()
      .from(concepts)
      .where(eq(concepts.id, conceptId))
      .get();

    if (!concept) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = buildExplainConceptPrompt(concept, mode);

    const response = await aiComplete({
      messages,
      taskType: "explain_concept",
    });

    return NextResponse.json({
      explanation: response.content,
      mode,
      conceptId,
    });
  } catch {
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
