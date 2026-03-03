"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Timer, Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useGameStore } from "@/stores/game-store";
import { useSubmitConceptClash } from "@/hooks/use-games";
import { toastBadge } from "@/hooks/use-toast";
import { BADGE_MAP } from "@/lib/gamification/badges";

interface ConceptClashProps {
  contentId: string;
}

export function ConceptClash({ contentId }: ConceptClashProps) {
  const store = useGameStore();
  const submitGame = useSubmitConceptClash(contentId);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  const question = store.clashQuestions[store.clashCurrentIndex];
  const isLastQuestion = store.clashCurrentIndex >= store.clashQuestions.length - 1;

  // Timer
  useEffect(() => {
    if (!store.isPlaying || showResult) return;
    setTimeLeft(15);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — treat as wrong answer
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [store.clashCurrentIndex, store.isPlaying, showResult]);

  const handleAnswer = useCallback(
    (index: number) => {
      if (showResult) return;
      setSelectedIndex(index);
      setShowResult(true);
      store.answerClash(index);
    },
    [showResult, store]
  );

  const handleNext = async () => {
    if (isLastQuestion || !store.isPlaying) {
      // Submit results
      const maxScore = store.clashQuestions.length * 10;
      const result = await submitGame.mutateAsync({
        score: store.clashScore,
        maxScore,
        correct: store.clashCorrect,
        total: store.clashQuestions.length,
      });
      store.setResult({
        gameType: "concept_clash",
        score: store.clashScore,
        maxScore,
        correct: store.clashCorrect,
        total: store.clashQuestions.length,
        xpEarned: result.xpEarned,
        streakBonus: result.streakBonus,
        totalXp: result.totalXp,
        newBadges: result.newBadges,
      });
      for (const badgeId of result.newBadges) {
        const badge = BADGE_MAP[badgeId];
        if (badge) toastBadge(badge.name);
      }
    } else {
      setSelectedIndex(null);
      setShowResult(false);
      store.nextClashQuestion();
    }
  };

  if (!question) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-warning" />
          <span className="text-sm font-medium text-text-secondary">
            Question {store.clashCurrentIndex + 1} / {store.clashQuestions.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {store.clashStreak >= 3 && (
            <div className="flex items-center gap-1 text-warning">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-bold">
                {store.clashStreak >= 8 ? "4x" : store.clashStreak >= 5 ? "3x" : "2x"}
              </span>
            </div>
          )}
          <div className="text-sm font-bold text-text-primary">
            Score: {store.clashScore}
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              timeLeft <= 5 ? "text-danger" : "text-text-secondary"
            )}
          >
            <Timer className="h-4 w-4" />
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h4 className="text-lg font-semibold text-text-primary">
          {question.conceptName}
        </h4>
        <p className="mt-1 text-sm text-text-secondary">
          Select the correct definition:
        </p>

        <div className="mt-4 space-y-3">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correctIndex;
            const isSelected = i === selectedIndex;

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={showResult}
                className={cn(
                  "w-full rounded-lg border p-3 text-left text-sm transition-all",
                  showResult && isCorrect && "border-success bg-success/10 text-text-primary",
                  showResult && isSelected && !isCorrect && "border-danger bg-danger/10 text-text-primary",
                  !showResult && "border-border bg-background hover:border-primary/40 hover:bg-primary/5 text-text-primary",
                  showResult && !isCorrect && !isSelected && "border-border bg-background text-text-secondary opacity-50"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next button */}
      {showResult && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={submitGame.isPending}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {submitGame.isPending
              ? "Submitting..."
              : isLastQuestion
                ? "See Results"
                : "Next Question"}
          </button>
        </div>
      )}
    </div>
  );
}
