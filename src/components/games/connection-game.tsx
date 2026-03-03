"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, Timer, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useGameStore } from "@/stores/game-store";
import { useSubmitConnectionGame } from "@/hooks/use-games";
import { toastBadge } from "@/hooks/use-toast";
import { BADGE_MAP } from "@/lib/gamification/badges";
import { shuffle } from "@/lib/gamification/game-helpers";

interface ConnectionGameProps {
  contentId: string;
}

export function ConnectionGame({ contentId }: ConnectionGameProps) {
  const store = useGameStore();
  const submitGame = useSubmitConnectionGame(contentId);

  const [leftItems, setLeftItems] = useState<Array<{ id: string; name: string }>>([]);
  const [rightItems, setRightItems] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Initialize shuffled columns
  useEffect(() => {
    setLeftItems(shuffle(store.connectionPairs.map((p) => ({ id: p.id, name: p.conceptName }))));
    setRightItems(shuffle(store.connectionPairs.map((p) => ({ id: p.id, name: p.relatedName }))));
  }, [store.connectionPairs]);

  // Timer
  useEffect(() => {
    if (!store.isPlaying) return;
    const interval = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [store.isPlaying]);

  // Check match when both sides selected
  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    setAttempts((a) => a + 1);

    if (selectedLeft === selectedRight) {
      // Correct match
      setMatchedIds((prev) => new Set([...prev, selectedLeft]));
      setCorrect((c) => c + 1);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Check if all matched
      if (matchedIds.size + 1 >= store.connectionPairs.length) {
        finishGame(correct + 1);
      }
    } else {
      // Wrong match — flash red briefly
      setWrongPair({ left: selectedLeft, right: selectedRight });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  }, [selectedLeft, selectedRight]);

  const finishGame = async (finalCorrect: number) => {
    const result = await submitGame.mutateAsync({
      correct: finalCorrect,
      total: store.connectionPairs.length,
      timeTaken: timeElapsed,
    });

    store.setResult({
      gameType: "connection",
      score: finalCorrect,
      maxScore: store.connectionPairs.length,
      correct: finalCorrect,
      total: store.connectionPairs.length,
      xpEarned: result.xpEarned,
      streakBonus: result.streakBonus,
      totalXp: result.totalXp,
      newBadges: result.newBadges,
      won: result.won,
    });

    for (const badgeId of result.newBadges) {
      const badge = BADGE_MAP[badgeId];
      if (badge) toastBadge(badge.name);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LinkIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-text-secondary">
            Matched: {matchedIds.size} / {store.connectionPairs.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Timer className="h-4 w-4" />
          {formatTime(timeElapsed)}
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-secondary uppercase">Concepts</p>
          {leftItems.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedLeft === item.id;
            const isWrong = wrongPair?.left === item.id;

            return (
              <button
                key={`left-${item.id}`}
                onClick={() => !isMatched && setSelectedLeft(item.id)}
                disabled={isMatched}
                className={cn(
                  "w-full rounded-lg border p-3 text-left text-sm transition-all",
                  isMatched && "border-success/30 bg-success/10 text-success",
                  isSelected && !isMatched && "border-primary bg-primary/10 text-primary",
                  isWrong && "border-danger bg-danger/10 text-danger",
                  !isMatched && !isSelected && !isWrong && "border-border bg-surface text-text-primary hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  {isMatched && <Check className="h-4 w-4" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-secondary uppercase">Related</p>
          {rightItems.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedRight === item.id;
            const isWrong = wrongPair?.right === item.id;

            return (
              <button
                key={`right-${item.id}`}
                onClick={() => !isMatched && setSelectedRight(item.id)}
                disabled={isMatched}
                className={cn(
                  "w-full rounded-lg border p-3 text-left text-sm transition-all",
                  isMatched && "border-success/30 bg-success/10 text-success",
                  isSelected && !isMatched && "border-primary bg-primary/10 text-primary",
                  isWrong && "border-danger bg-danger/10 text-danger",
                  !isMatched && !isSelected && !isWrong && "border-border bg-surface text-text-primary hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  {isMatched && <Check className="h-4 w-4" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
