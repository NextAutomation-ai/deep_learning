import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { devilsAdvocateDebates, userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiComplete, aiCompleteJson } from "@/lib/ai/router";
import {
  buildDevilsAdvocatePrompt,
  buildDefenseEvaluationPrompt,
  type DefenseEvaluation,
} from "@/lib/ai/prompts/devils-advocate";
import { XP_REWARDS, getLevelInfo } from "@/lib/learning/xp";
import { updateStreak } from "@/lib/gamification/update-streak";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string; debateId: string }> }
) {
  const { debateId } = await params;
  const debate = db
    .select()
    .from(devilsAdvocateDebates)
    .where(eq(devilsAdvocateDebates.id, debateId))
    .get();

  if (!debate) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  return NextResponse.json({ debate });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string; debateId: string }> }
) {
  try {
    const user = await getUser();
    const { debateId } = await params;
    const body = await request.json();
    const { message, action } = body as {
      message?: string;
      action?: "complete";
    };

    const debate = db
      .select()
      .from(devilsAdvocateDebates)
      .where(eq(devilsAdvocateDebates.id, debateId))
      .get();

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    const currentMessages = (debate.messages as Array<{
      role: "ai" | "user";
      content: string;
      timestamp: number;
    }>) || [];

    // Complete and evaluate
    if (action === "complete") {
      const evalMessages = buildDefenseEvaluationPrompt(
        debate.originalClaim,
        currentMessages
      );

      const evaluation = await aiCompleteJson<DefenseEvaluation>({
        messages: evalMessages,
        taskType: "evaluate_response",
        responseFormat: "json",
      });

      const overallScore =
        (evaluation.reasoning + evaluation.evidence + evaluation.counterPoints) /
        3;

      const xpEarned = Math.round(XP_REWARDS.devils_advocate * overallScore);

      db.update(devilsAdvocateDebates)
        .set({
          status: "completed",
          reasoningScore: evaluation.reasoning,
          evidenceScore: evaluation.evidence,
          counterPointsScore: evaluation.counterPoints,
          overallScore,
          xpEarned,
          completedAt: new Date(),
        })
        .where(eq(devilsAdvocateDebates.id, debateId))
        .run();

      updateUserStats(user.user.id, xpEarned);
      updateStreak(user.user.id);

      const newBadges = checkBadges(user.user.id, "thinking_completed");
      awardBadges(user.user.id, newBadges);

      return NextResponse.json({
        completed: true,
        scores: {
          reasoning: evaluation.reasoning,
          evidence: evaluation.evidence,
          counterPoints: evaluation.counterPoints,
          overall: overallScore,
        },
        feedback: evaluation.feedback,
        xpEarned,
        newBadges,
      });
    }

    // Continue debate
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const now = Date.now();
    const updatedMessages = [
      ...currentMessages,
      { role: "user" as const, content: message, timestamp: now },
    ];

    const promptMessages = buildDevilsAdvocatePrompt(
      debate.originalClaim,
      debate.steelManMode ?? false,
      updatedMessages
    );

    const response = await aiComplete({
      messages: promptMessages,
      taskType: "devils_advocate",
    });

    const aiResponse = response.content.trim();
    updatedMessages.push({
      role: "ai" as const,
      content: aiResponse,
      timestamp: Date.now(),
    });

    db.update(devilsAdvocateDebates)
      .set({ messages: updatedMessages })
      .where(eq(devilsAdvocateDebates.id, debateId))
      .run();

    return NextResponse.json({
      aiResponse,
      canComplete: updatedMessages.filter((m) => m.role === "user").length >= 2,
    });
  } catch {
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}

function updateUserStats(userId: string, xpEarned: number) {
  const existing = db
    .select()
    .from(userStats)
    .all()
    .find((s) => s.userId === userId);

  if (existing) {
    const newXp = (existing.totalXp ?? 0) + xpEarned;
    const levelInfo = getLevelInfo(newXp);
    db.update(userStats)
      .set({
        totalXp: newXp,
        level: levelInfo.level,
        updatedAt: new Date(),
      })
      .where(eq(userStats.id, existing.id))
      .run();
  } else {
    const levelInfo = getLevelInfo(xpEarned);
    db.insert(userStats)
      .values({
        userId,
        totalXp: xpEarned,
        level: levelInfo.level,
      })
      .run();
  }
}
