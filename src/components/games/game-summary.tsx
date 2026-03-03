"use client";

import { Trophy, Star, Flame, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useGameStore } from "@/stores/game-store";
import { BADGE_MAP } from "@/lib/gamification/badges";

interface GameSummaryProps {
  onPlayAgain: () => void;
  onBack: () => void;
}

export function GameSummary({ onPlayAgain, onBack }: GameSummaryProps) {
  const { result } = useGameStore();

  if (!result) return null;

  const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

  const gameNames: Record<string, string> = {
    concept_clash: "Concept Clash",
    connection: "Connection Game",
    concept_tower: "Concept Tower",
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Trophy/Result */}
      <div className="text-center">
        <div
          className={cn(
            "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full",
            pct >= 80 ? "bg-warning/20" : pct >= 50 ? "bg-primary/20" : "bg-border"
          )}
        >
          <Trophy
            className={cn(
              "h-8 w-8",
              pct >= 80 ? "text-warning" : pct >= 50 ? "text-primary" : "text-text-secondary"
            )}
          />
        </div>
        <h3 className="text-xl font-bold text-text-primary">
          {pct >= 80 ? "Excellent!" : pct >= 50 ? "Good Job!" : "Keep Practicing!"}
        </h3>
        <p className="text-sm text-text-secondary">
          {gameNames[result.gameType] || result.gameType}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {result.correct}/{result.total}
          </p>
          <p className="text-xs text-text-secondary">Correct</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{pct}%</p>
          <p className="text-xs text-text-secondary">Score</p>
        </div>
      </div>

      {/* XP earned */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-text-primary">XP Earned</span>
          </div>
          <span className="text-lg font-bold text-primary">+{result.totalXp}</span>
        </div>
        {result.streakBonus > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
            <Flame className="h-3 w-3 text-warning" />
            Streak bonus: +{result.streakBonus} XP
          </div>
        )}
      </div>

      {/* New badges */}
      {result.newBadges.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="mb-2 text-sm font-semibold text-text-primary">
            Badges Unlocked!
          </p>
          <div className="space-y-2">
            {result.newBadges.map((badgeId) => {
              const badge = BADGE_MAP[badgeId];
              if (!badge) return null;
              return (
                <div key={badgeId} className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-text-primary">
                    {badge.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    — {badge.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-background"
        >
          Back to Games
        </button>
        <button
          onClick={onPlayAgain}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          Play Again
        </button>
      </div>
    </div>
  );
}
