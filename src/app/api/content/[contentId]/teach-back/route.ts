import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import {
  concepts,
  teachBackResponses,
  learningSessions,
  userStats,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiCompleteJson } from "@/lib/ai/router";
import {
  buildTeachBackEvaluationPrompt,
  type TeachBackEvaluation,
} from "@/lib/ai/prompts/teach-back";
import { XP_REWARDS, getLevelInfo } from "@/lib/learning/xp";
import { updateStreak } from "@/lib/gamification/update-streak";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await getUser();
    const { contentId } = await params;
    const body = await request.json();
    const { conceptId, userExplanation } = body as {
      conceptId: string;
      userExplanation: string;
    };

    if (!conceptId || !userExplanation) {
      return NextResponse.json(
        { error: "conceptId and userExplanation are required" },
        { status: 400 }
      );
    }

    const concept = db
      .select()
      .from(concepts)
      .where(eq(concepts.id, conceptId))
      .get();

    if (!concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    }

    // Evaluate teach-back
    const messages = buildTeachBackEvaluationPrompt(
      concept.name,
      concept.definition,
      concept.detailedExplanation,
      userExplanation
    );

    const evaluation = await aiCompleteJson<TeachBackEvaluation>({
      messages,
      taskType: "teach_back_evaluation",
      responseFormat: "json",
    });

    const overallScore =
      (evaluation.accuracyScore +
        evaluation.completenessScore +
        evaluation.reasoningScore +
        evaluation.criticalThinkingScore) /
      4;

    const xpEarned = Math.round(XP_REWARDS.teach_back * overallScore);

    // Save response
    db.insert(teachBackResponses)
      .values({
        userId: session.user.id,
        conceptId,
        userExplanation,
        aiFeedback: evaluation.feedback,
        accuracyScore: evaluation.accuracyScore,
        completenessScore: evaluation.completenessScore,
        reasoningScore: evaluation.reasoningScore,
        criticalThinkingScore: evaluation.criticalThinkingScore,
      })
      .run();

    // Create learning session
    db.insert(learningSessions)
      .values({
        userId: session.user.id,
        contentId,
        sessionType: "teach_back",
        conceptsCovered: [conceptId],
        xpEarned,
      })
      .run();

    // Award XP and update streak
    updateUserStats(session.user.id, xpEarned);
    updateStreak(session.user.id);

    // Check thinking badges
    const newBadges = checkBadges(session.user.id, "thinking_completed");
    awardBadges(session.user.id, newBadges);

    return NextResponse.json({
      scores: {
        accuracy: evaluation.accuracyScore,
        completeness: evaluation.completenessScore,
        reasoning: evaluation.reasoningScore,
        criticalThinking: evaluation.criticalThinkingScore,
        overall: overallScore,
      },
      feedback: evaluation.feedback,
      xpEarned,
      newBadges,
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
