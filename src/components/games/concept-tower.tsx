"use client";

import { useState } from "react";
import { Building2, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useGameStore } from "@/stores/game-store";
import { useSubmitConceptTower } from "@/hooks/use-games";
import { toastBadge } from "@/hooks/use-toast";
import { BADGE_MAP } from "@/lib/gamification/badges";

interface ConceptTowerProps {
  contentId: string;
}

export function ConceptTower({ contentId }: ConceptTowerProps) {
  const store = useGameStore();
  const submitGame = useSubmitConceptTower(contentId);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const block = store.towerBlocks[store.towerCurrentLevel];
  const isFinished = !store.isPlaying && store.towerCurrentLevel > 0;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
    setShowResult(true);
    const isCorrect = store.answerTower(index);
    setLastCorrect(isCorrect);
  };

  const handleNext = async () => {
    // Check if game ended
    if (!store.isPlaying) {
      const result = await submitGame.mutateAsync({
        levelsCompleted: store.towerCurrentLevel,
        totalLevels: store.towerBlocks.length,
        livesRemaining: store.towerLives,
      });

      store.setResult({
        gameType: "concept_tower",
        score: store.towerCurrentLevel,
        maxScore: store.towerBlocks.length,
        correct: store.towerCurrentLevel,
        total: store.towerBlocks.length,
        xpEarned: result.xpEarned,
        streakBonus: result.streakBonus,
        totalXp: result.totalXp,
        newBadges: result.newBadges,
        won: result.won,
        levelsCompleted: result.levelsCompleted,
      });

      for (const badgeId of result.newBadges) {
        const badge = BADGE_MAP[badgeId];
        if (badge) toastBadge(badge.name);
      }
    } else {
      setSelectedIndex(null);
      setShowResult(false);
      setLastCorrect(null);
    }
  };

  if (!block && !isFinished) return null;

  // Tower visualization
  const completedLevels = store.towerCurrentLevel;
  const totalLevels = store.towerBlocks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-success" />
          <span className="text-sm font-medium text-text-secondary">
            Level {Math.min(completedLevels + 1, totalLevels)} / {totalLevels}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: store.towerMaxLives }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                "h-5 w-5",
                i < store.towerLives
                  ? "fill-danger text-danger"
                  : "text-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Tower progress bar */}
      <div className="flex gap-1">
        {Array.from({ length: totalLevels }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-all",
              i < completedLevels
                ? "bg-success"
                : i === completedLevels
                  ? "bg-primary"
                  : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Current question */}
      {block && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              Difficulty: {"*".repeat(block.difficulty)}
            </span>
          </div>
          <h4 className="text-base font-semibold text-text-primary">
            {block.question}
          </h4>

          <div className="mt-4 space-y-3">
            {block.options.map((option, i) => {
              const isCorrect = i === block.correctIndex;
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
                    !showResult && "border-border bg-background text-text-primary hover:border-primary/40 hover:bg-primary/5",
                    showResult && !isCorrect && !isSelected && "border-border bg-background text-text-secondary opacity-50"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-4 flex items-center justify-between">
              <span
                className={cn(
                  "text-sm font-medium",
                  lastCorrect ? "text-success" : "text-danger"
                )}
              >
                {lastCorrect ? "Correct! Tower grows!" : "Wrong! You lost a life."}
              </span>
              <button
                onClick={handleNext}
                disabled={submitGame.isPending}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {submitGame.isPending ? "Submitting..." : store.isPlaying ? "Next Level" : "See Results"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
