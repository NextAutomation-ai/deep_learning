import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import {
  biasDetectionExercises,
  contentChunks,
  learningSessions,
  userStats,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { aiCompleteJson } from "@/lib/ai/router";
import {
  buildBiasDetectionPrompt,
  buildBiasEvaluationPrompt,
  type BiasQuestions,
  type BiasEvaluation,
} from "@/lib/ai/prompts/bias-detection";
import { XP_REWARDS, getLevelInfo } from "@/lib/learning/xp";
import { updateStreak } from "@/lib/gamification/update-streak";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";

// POST: Start a new bias detection exercise
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const session = await getUser();
    const { contentId } = await params;
    const body = await request.json();
    const { chunkId } = body as { chunkId?: string };

    // Get a passage from content chunks
    let passage: string;
    let selectedChunkId: string | null = null;

    if (chunkId) {
      const chunk = db
        .select()
        .from(contentChunks)
        .where(eq(contentChunks.id, chunkId))
        .get();
      if (!chunk) {
        return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
      }
      passage = chunk.text;
      selectedChunkId = chunk.id;
    } else {
      // Pick a random chunk with substantial text
      const chunks = db
        .select()
        .from(contentChunks)
        .where(eq(contentChunks.contentId, contentId))
        .all()
        .filter((c) => c.text.length > 200);

      if (chunks.length === 0) {
        return NextResponse.json(
          { error: "No suitable passages found" },
          { status: 404 }
        );
      }

      const chunk = chunks[Math.floor(Math.random() * chunks.length)];
      passage = chunk.text;
      selectedChunkId = chunk.id;
    }

    // Truncate passage if too long
    if (passage.length > 2000) {
      passage = passage.slice(0, 2000) + "...";
    }

    // Generate guided questions
    const promptMessages = buildBiasDetectionPrompt(passage);
    const result = await aiCompleteJson<BiasQuestions>({
      messages: promptMessages,
      taskType: "bias_detection",
      responseFormat: "json",
    });

    // Create exercise
    const exercise = db
      .insert(biasDetectionExercises)
      .values({
        userId: session.user.id,
        contentId,
        chunkId: selectedChunkId,
        passage,
        guidedQuestions: result.questions,
      })
      .returning()
      .get();

    // Create learning session
    db.insert(learningSessions)
      .values({
        userId: session.user.id,
        contentId,
        sessionType: "bias_detection",
      })
      .run();

    return NextResponse.json({
      exerciseId: exercise.id,
      passage,
      questions: result.questions,
    });
  } catch {
    return NextResponse.json(
      { error: "AI service temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }
}

// PUT: Submit answers for evaluation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const user = await getUser();
    await params;
    const body = await request.json();
    const { exerciseId, responses } = body as {
      exerciseId: string;
      responses: Array<{ question: string; answer: string }>;
    };

    const exercise = db
      .select()
      .from(biasDetectionExercises)
      .where(eq(biasDetectionExercises.id, exerciseId))
      .get();

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Evaluate responses
    const evalMessages = buildBiasEvaluationPrompt(exercise.passage, responses);
    const evaluation = await aiCompleteJson<BiasEvaluation>({
      messages: evalMessages,
      taskType: "evaluate_response",
      responseFormat: "json",
    });

    const overallScore =
      (evaluation.perspectiveScore +
        evaluation.factOpinionScore +
        evaluation.biasIdentificationScore) /
      3;

    const xpEarned = Math.round(XP_REWARDS.bias_detection * overallScore);

    // Update exercise
    db.update(biasDetectionExercises)
      .set({
        userResponses: responses,
        aiFeedback: evaluation.feedback,
        perspectiveScore: evaluation.perspectiveScore,
        factOpinionScore: evaluation.factOpinionScore,
        biasIdentificationScore: evaluation.biasIdentificationScore,
        overallScore,
        xpEarned,
        completedAt: new Date(),
      })
      .where(eq(biasDetectionExercises.id, exerciseId))
      .run();

    // Award XP and update streak
    updateUserStats(user.user.id, xpEarned);
    updateStreak(user.user.id);

    // Check thinking badges
    const newBadges = checkBadges(user.user.id, "thinking_completed");
    awardBadges(user.user.id, newBadges);

    return NextResponse.json({
      scores: {
        perspective: evaluation.perspectiveScore,
        factOpinion: evaluation.factOpinionScore,
        biasIdentification: evaluation.biasIdentificationScore,
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
