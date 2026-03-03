import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { concepts, contentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiCompleteJson } from "@/lib/ai/router";
import {
  buildCompareConceptsPrompt,
  type ConceptCompareResult,
} from "@/lib/ai/prompts/compare-concepts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    await getUser();
    const { contentId } = await params;
    const body = await request.json();
    const { conceptIdA, conceptIdB } = body as {
      conceptIdA: string;
      conceptIdB: string;
    };

    if (!conceptIdA || !conceptIdB) {
      return NextResponse.json(
        { error: "Both concept IDs are required" },
        { status: 400 }
      );
    }

    const conceptA = db
      .select()
      .from(concepts)
      .where(eq(concepts.id, conceptIdA))
      .get();

    const conceptB = db
      .select()
      .from(concepts)
      .where(eq(concepts.id, conceptIdB))
      .get();

    if (!conceptA || !conceptB) {
      return NextResponse.json(
        { error: "Concept not found" },
        { status: 404 }
      );
    }

    // Get source context from chunks
    const chunks = db
      .select()
      .from(contentChunks)
      .where(eq(contentChunks.contentId, contentId))
      .all();

    const sourceContext = chunks
      .slice(0, 4)
      .map((c) => c.text)
      .join("\n\n");

    const messages = buildCompareConceptsPrompt(
      {
        name: conceptA.name,
        definition: conceptA.definition,
        detailedExplanation: conceptA.detailedExplanation,
      },
      {
        name: conceptB.name,
        definition: conceptB.definition,
        detailedExplanation: conceptB.detailedExplanation,
      },
      sourceContext
    );

    const result = await aiCompleteJson<ConceptCompareResult>({
      messages,
      taskType: "compare_concepts",
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
