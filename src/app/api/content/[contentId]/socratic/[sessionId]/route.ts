import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { socraticSessions, concepts, userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiComplete, aiCompleteJson } from "@/lib/ai/router";
import {
  buildSocraticQuestionPrompt,
  buildSocraticEvaluationPrompt,
  type SocraticEvaluation,
} from "@/lib/ai/prompts/socratic-questioning";
import { XP_REWARDS, getLevelInfo } from "@/lib/learning/xp";
import { updateStreak } from "@/lib/gamification/update-streak";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string; sessionId: string }> }
) {
  const userSession = await getUser();
  const { contentId, sessionId } = await params;

  if (!verifyContentOwnership(contentId, userSession.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = db
    .select()
    .from(socraticSessions)
    .where(eq(socraticSessions.id, sessionId))
    .get();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string; sessionId: string }> }
) {
  try {
    const user = await getUser();
    const { contentId, sessionId } = await params;

    if (!verifyContentOwnership(contentId, user.user.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const { message, action } = body as {
      message?: string;
      action?: "complete";
    };

    const session = db
      .select()
      .from(socraticSessions)
      .where(eq(socraticSessions.id, sessionId))
      .get();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const currentMessages = (session.messages as Array<{
      role: "ai" | "user";
      content: string;
      timestamp: number;
    }>) || [];

    // Complete the session and evaluate
    if (action === "complete") {
      const concept = session.conceptId
        ? db.select().from(concepts).where(eq(concepts.id, session.conceptId)).get()
        : null;

      const evalMessages = buildSocraticEvaluationPrompt(
        concept?.name || "Unknown",
        currentMessages
      );

      const evaluation = await aiCompleteJson<SocraticEvaluation>({
        messages: evalMessages,
        taskType: "evaluate_response",
        responseFormat: "json",
      });

      const overallScore =
        (evaluation.depth +
          evaluation.evidence +
          evaluation.alternatives +
          evaluation.coherence) /
        4;

      const xpEarned = Math.round(XP_REWARDS.socratic_session * overallScore);

      db.update(socraticSessions)
        .set({
          status: "completed",
          depthScore: evaluation.depth,
          evidenceScore: evaluation.evidence,
          alternativesScore: evaluation.alternatives,
          coherenceScore: evaluation.coherence,
          overallScore,
          xpEarned,
          completedAt: new Date(),
        })
        .where(eq(socraticSessions.id, sessionId))
        .run();

      // Award XP and update streak
      updateUserStats(user.user.id, xpEarned);
      updateStreak(user.user.id);

      // Check thinking badges
      const newBadges = checkBadges(user.user.id, "thinking_completed");
      awardBadges(user.user.id, newBadges);

      return NextResponse.json({
        completed: true,
        scores: {
          depth: evaluation.depth,
          evidence: evaluation.evidence,
          alternatives: evaluation.alternatives,
          coherence: evaluation.coherence,
          overall: overallScore,
        },
        feedback: evaluation.feedback,
        xpEarned,
        newBadges,
      });
    }

    // Continue conversation — add user message and generate follow-up
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const now = Date.now();
    const updatedMessages = [
      ...currentMessages,
      { role: "user" as const, content: message, timestamp: now },
    ];

    // Get concept for context
    const concept = session.conceptId
      ? db.select().from(concepts).where(eq(concepts.id, session.conceptId)).get()
      : null;

    const promptMessages = buildSocraticQuestionPrompt(
      concept?.name || "Unknown",
      concept?.definition || "",
      concept?.sourceExcerpt || "",
      updatedMessages
    );

    const response = await aiComplete({
      messages: promptMessages,
      taskType: "socratic_questions",
    });

    const aiResponse = response.content.trim();
    updatedMessages.push({
      role: "ai" as const,
      content: aiResponse,
      timestamp: Date.now(),
    });

    db.update(socraticSessions)
      .set({
        messages: updatedMessages,
        questionsAsked: (session.questionsAsked ?? 0) + 1,
      })
      .where(eq(socraticSessions.id, sessionId))
      .run();

    return NextResponse.json({
      aiResponse,
      questionsAsked: (session.questionsAsked ?? 0) + 1,
      canComplete: updatedMessages.filter((m) => m.role === "user").length >= 3,
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
