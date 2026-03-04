import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type QuizMode = "standard" | "adaptive" | "chapter" | "boss_battle" | "speed_round";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;
  if (!verifyContentOwnership(contentId, session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const mode: QuizMode = body.mode || "standard";

  // Get all questions for this content
  const allQuestions = db
    .select()
    .from(questions)
    .where(eq(questions.contentId, contentId))
    .all();

  if (allQuestions.length === 0) {
    return NextResponse.json(
      { error: "No questions available. Process content first." },
      { status: 404 }
    );
  }

  let selected;
  const quizId = crypto.randomUUID();

  switch (mode) {
    case "standard": {
      // 10-20 mixed questions, random
      const count = Math.min(Math.max(10, Math.floor(allQuestions.length / 2)), 20);
      selected = shuffle(allQuestions).slice(0, count);
      break;
    }
    case "adaptive": {
      // Start with medium difficulty, will be reordered client-side
      const sorted = [...allQuestions].sort(
        (a, b) => (a.difficultyLevel ?? 1) - (b.difficultyLevel ?? 1)
      );
      const mid = Math.floor(sorted.length / 2);
      // Take from around the middle, expanding outward
      const count = Math.min(15, sorted.length);
      const start = Math.max(0, mid - Math.floor(count / 2));
      selected = sorted.slice(start, start + count);
      break;
    }
    case "boss_battle": {
      // 30-50 comprehensive, all difficulties
      const count = Math.min(Math.max(30, allQuestions.length), 50);
      selected = shuffle(allQuestions).slice(0, count);
      break;
    }
    case "speed_round": {
      // 10 quick MCQ/true-false only, 5s per question
      const quickTypes = ["mcq", "true_false"];
      const quickQuestions = allQuestions.filter((q) =>
        quickTypes.includes(q.questionType)
      );
      selected = shuffle(quickQuestions.length > 0 ? quickQuestions : allQuestions)
        .slice(0, 10)
        .map((q) => ({ ...q, timeLimitSeconds: 5 }));
      break;
    }
    case "chapter": {
      const chunkId = body.chunkId;
      if (chunkId) {
        selected = allQuestions.filter((q) => q.chunkId === chunkId);
      } else {
        selected = shuffle(allQuestions).slice(0, 15);
      }
      break;
    }
    default:
      selected = shuffle(allQuestions).slice(0, 15);
  }

  // Strip correct answers from response (sent on submit)
  const quizQuestions = selected.map((q) => ({
    id: q.id,
    questionType: q.questionType,
    questionText: q.questionText,
    options: q.options,
    difficultyLevel: q.difficultyLevel,
    bloomsLevel: q.bloomsLevel,
    points: q.points,
    timeLimitSeconds: q.timeLimitSeconds,
    conceptId: q.conceptId,
  }));

  return NextResponse.json({
    quizId,
    mode,
    questions: quizQuestions,
    totalQuestions: quizQuestions.length,
  });
}

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
