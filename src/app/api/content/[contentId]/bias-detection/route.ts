import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import {
  biasDetectionExercises,
  contentChunks,
  learningSessions,
  userStats,
} from "@/lib/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
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
      const chunk = (await db
        .select()
        .from(contentChunks)
        .where(eq(contentChunks.id, chunkId))
        .limit(1))[0];
      if (!chunk) {
        return NextResponse.json({ error: "Chunk not found" }, { status: 404 });
      }
      passage = chunk.text;
      selectedChunkId = chunk.id;
    } else {
      // Pick a random chunk with substantial text
      const chunks = (await db
        .select()
        .from(contentChunks)
        .where(
          and(
            eq(contentChunks.contentId, contentId),
            gt(sql`length(${contentChunks.text})`, 200)
          )
        ));

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
    const [exercise] = await db
      .insert(biasDetectionExercises)
      .values({
        userId: session.user.id,
        contentId,
        chunkId: selectedChunkId,
        passage,
        guidedQuestions: result.questions,
      })
      .returning();

    // Create learning session
    await db.insert(learningSessions)
      .values({
        userId: session.user.id,
        contentId,
        sessionType: "bias_detection",
      });

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

    const exercise = (await db
      .select()
      .from(biasDetectionExercises)
      .where(eq(biasDetectionExercises.id, exerciseId))
      .limit(1))[0];

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
    await db.update(biasDetectionExercises)
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
      .where(eq(biasDetectionExercises.id, exerciseId));

    // Award XP and update streak
    await updateUserStats(user.user.id, xpEarned);
    await updateStreak(user.user.id);

    // Check thinking badges
    const newBadges = await checkBadges(user.user.id, "thinking_completed");
    await awardBadges(user.user.id, newBadges);

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

async function updateUserStats(userId: string, xpEarned: number) {
  const existing = (await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1))[0];

  if (existing) {
    const newXp = (existing.totalXp ?? 0) + xpEarned;
    const levelInfo = getLevelInfo(newXp);
    await db.update(userStats)
      .set({
        totalXp: newXp,
        level: levelInfo.level,
        updatedAt: new Date(),
      })
      .where(eq(userStats.id, existing.id));
  } else {
    const levelInfo = getLevelInfo(xpEarned);
    await db.insert(userStats)
      .values({
        userId,
        totalXp: xpEarned,
        level: levelInfo.level,
      });
  }
}
