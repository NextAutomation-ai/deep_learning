import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { questions, quizAttempts, userProgress, userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateQuizXp, getLevelInfo } from "@/lib/learning/xp";
import { checkBadges, awardBadges } from "@/lib/gamification/badge-engine";
import { updateStreak } from "@/lib/gamification/update-streak";

interface SubmitAnswer {
  questionId: string;
  userAnswer: string;
  timeTaken?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;
  const body = await request.json();
  const { quizId, answers, mode } = body as {
    quizId: string;
    answers: SubmitAnswer[];
    mode: string;
  };

  // Load all questions for grading
  const allQuestions = db
    .select()
    .from(questions)
    .where(eq(questions.contentId, contentId))
    .all();

  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

  let totalScore = 0;
  let maxScore = 0;
  let correct = 0;
  const results: Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string | null;
    explanation: string | null;
    points: number;
  }> = [];

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const points = question.points ?? 10;
    maxScore += points;

    const isCorrect = gradeAnswer(
      answer.userAnswer,
      question.correctAnswer,
      question.questionType
    );

    if (isCorrect) {
      totalScore += points;
      correct++;
    }

    results.push({
      questionId: answer.questionId,
      isCorrect,
      userAnswer: answer.userAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points: isCorrect ? points : 0,
    });

    // Update user progress for the concept
    if (question.conceptId) {
      updateConceptProgress(
        session.user.id,
        contentId,
        question.conceptId,
        isCorrect,
        question.questionType
      );
    }
  }

  // Calculate XP
  const xpEarned = calculateQuizXp(totalScore, maxScore, mode || "standard");

  // Create quiz attempt record
  db.insert(quizAttempts)
    .values({
      userId: session.user.id,
      contentId,
      quizType: mode || "standard",
      questionsAttempted: answers.length,
      questionsCorrect: correct,
      score: totalScore,
      maxScore,
      difficultyLevel: 1,
      answers: results as unknown as null,
    })
    .run();

  // Update user stats and streak
  updateUserStats(session.user.id, xpEarned);
  updateStreak(session.user.id);

  // Check and award badges
  const newBadges = checkBadges(session.user.id, "quiz_completed");
  awardBadges(session.user.id, newBadges);

  // Check concept mastery badges
  const masteryBadges = checkBadges(session.user.id, "concept_mastered");
  awardBadges(session.user.id, masteryBadges);

  return NextResponse.json({
    quizId,
    score: totalScore,
    maxScore,
    questionsCorrect: correct,
    questionsAttempted: answers.length,
    xpEarned,
    newBadges,
    results,
  });
}

function gradeAnswer(
  userAnswer: string,
  correctAnswer: string | null,
  questionType: string
): boolean {
  if (!correctAnswer || !userAnswer) return false;

  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  switch (questionType) {
    case "mcq":
    case "true_false":
      return normalizedUser === normalizedCorrect;
    case "fill_blank":
      // Allow some flexibility
      return (
        normalizedUser === normalizedCorrect ||
        normalizedCorrect.includes(normalizedUser) ||
        normalizedUser.includes(normalizedCorrect)
      );
    case "short_answer":
      // Simple keyword matching (AI grading would be better but this works for now)
      const keywords = normalizedCorrect.split(/\s+/);
      const matches = keywords.filter((k) => normalizedUser.includes(k));
      return matches.length >= keywords.length * 0.5;
    default:
      return normalizedUser === normalizedCorrect;
  }
}

const BLOOMS_ORDER = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

function getBloomsLevel(questionType: string): string {
  switch (questionType) {
    case "mcq":
    case "true_false":
      return "remember";
    case "fill_blank":
      return "understand";
    case "short_answer":
      return "apply";
    case "scenario":
      return "analyze";
    case "explain":
      return "evaluate";
    default:
      return "remember";
  }
}

function updateConceptProgress(
  userId: string,
  contentId: string,
  conceptId: string,
  isCorrect: boolean,
  questionType: string
) {
  const existing = db
    .select()
    .from(userProgress)
    .all()
    .find(
      (p) =>
        p.userId === userId &&
        p.contentId === contentId &&
        p.conceptId === conceptId
    );

  const newBlooms = getBloomsLevel(questionType);

  if (existing) {
    const timesReviewed = (existing.timesReviewed ?? 0) + 1;
    const timesCorrect = (existing.timesCorrect ?? 0) + (isCorrect ? 1 : 0);
    const timesIncorrect = (existing.timesIncorrect ?? 0) + (isCorrect ? 0 : 1);
    const newMastery = timesCorrect / timesReviewed;

    // Only upgrade Bloom's level, never downgrade
    const currentBloomsIdx = BLOOMS_ORDER.indexOf(existing.bloomsAchieved ?? "remember");
    const newBloomsIdx = BLOOMS_ORDER.indexOf(newBlooms);
    const bloomsAchieved = isCorrect && newBloomsIdx > currentBloomsIdx
      ? newBlooms
      : (existing.bloomsAchieved ?? "remember");

    db.update(userProgress)
      .set({
        masteryLevel: Math.round(newMastery * 100) / 100,
        timesReviewed,
        timesCorrect,
        timesIncorrect,
        streak: isCorrect ? (existing.streak ?? 0) + 1 : 0,
        bloomsAchieved,
        lastReviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userProgress.id, existing.id))
      .run();
  } else {
    db.insert(userProgress)
      .values({
        userId,
        contentId,
        conceptId,
        masteryLevel: isCorrect ? 1 : 0,
        timesReviewed: 1,
        timesCorrect: isCorrect ? 1 : 0,
        timesIncorrect: isCorrect ? 0 : 1,
        streak: isCorrect ? 1 : 0,
        bloomsAchieved: isCorrect ? newBlooms : "remember",
        lastReviewedAt: new Date(),
      })
      .run();
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
        totalQuizzesCompleted: (existing.totalQuizzesCompleted ?? 0) + 1,
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
        totalQuizzesCompleted: 1,
      })
      .run();
  }
}
