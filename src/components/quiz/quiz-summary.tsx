"use client";

import { Trophy, Star, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QuizResults {
  score: number;
  maxScore: number;
  questionsCorrect: number;
  questionsAttempted: number;
  xpEarned: number;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string | null;
    explanation: string | null;
    points: number;
  }>;
}

export function QuizSummary({
  results,
  onClose,
}: {
  results: Record<string, unknown>;
  onClose: () => void;
}) {
  const r = results as unknown as QuizResults;
  const percentage = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
  const passed = percentage >= 70;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Score Card */}
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <div
          className={cn(
            "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full",
            passed ? "bg-success/10" : "bg-warning/10"
          )}
        >
          <Trophy className={cn("h-10 w-10", passed ? "text-success" : "text-warning")} />
        </div>

        <h2 className="text-3xl font-bold text-text-primary">{percentage}%</h2>
        <p className="mt-1 text-text-secondary">
          {r.questionsCorrect} of {r.questionsAttempted} correct
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          <span className="text-lg font-semibold text-warning">+{r.xpEarned} XP</span>
        </div>

        <p className="mt-2 text-sm text-text-secondary">
          Score: {r.score} / {r.maxScore}
        </p>
      </div>

      {/* Answer Review */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">Answer Review</h3>
        <div className="space-y-3">
          {r.results?.map((result, i) => (
            <div
              key={result.questionId}
              className={cn(
                "rounded-lg border p-4",
                result.isCorrect ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
              )}
            >
              <div className="flex items-start gap-3">
                {result.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">Question {i + 1}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Your answer: {result.userAnswer || "(no answer)"}
                  </p>
                  {!result.isCorrect && result.correctAnswer && (
                    <p className="mt-1 text-xs text-success">
                      Correct: {result.correctAnswer}
                    </p>
                  )}
                  {result.explanation && (
                    <p className="mt-2 text-xs text-text-secondary">{result.explanation}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-text-secondary">
                  {result.points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Close */}
      <div className="text-center">
        <button
          onClick={onClose}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
