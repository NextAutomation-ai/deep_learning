import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { devilsAdvocateDebates, learningSessions } from "@/lib/db/schema";
import { aiComplete } from "@/lib/ai/router";
import { buildDevilsAdvocatePrompt } from "@/lib/ai/prompts/devils-advocate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await getUser();
    const { contentId } = await params;
    const body = await request.json();
    const { claim, argumentId, steelManMode } = body as {
      claim: string;
      argumentId?: string;
      steelManMode?: boolean;
    };

    if (!claim) {
      return NextResponse.json({ error: "Claim is required" }, { status: 400 });
    }

    const isSteel = steelManMode ?? false;

    // Generate AI counter-argument
    const messages = buildDevilsAdvocatePrompt(claim, isSteel, []);

    const response = await aiComplete({
      messages,
      taskType: "devils_advocate",
    });

    const aiCounterArgument = response.content.trim();
    const now = Date.now();

    // Create debate record
    const debate = db
      .insert(devilsAdvocateDebates)
      .values({
        userId: session.user.id,
        contentId,
        argumentId: argumentId || null,
        originalClaim: claim,
        steelManMode: isSteel,
        status: "active",
        messages: [
          { role: "ai" as const, content: aiCounterArgument, timestamp: now },
        ],
      })
      .returning()
      .get();

    // Create learning session
    db.insert(learningSessions)
      .values({
        userId: session.user.id,
        contentId,
        sessionType: "devils_advocate",
      })
      .run();

    return NextResponse.json({
      debateId: debate.id,
      aiCounterArgument,
      steelManMode: isSteel,
    });
  } catch {
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
