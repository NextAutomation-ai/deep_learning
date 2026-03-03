"use client";

import { Zap, Link, Building2 } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import {
  useStartConceptClash,
  useStartConnectionGame,
  useStartConceptTower,
} from "@/hooks/use-games";
import { toastError } from "@/hooks/use-toast";

const GAMES = [
  {
    id: "concept_clash" as const,
    name: "Concept Clash",
    description: "Race against the clock matching concepts to definitions. Build streaks for bonus points!",
    icon: Zap,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    id: "connection" as const,
    name: "Connection Game",
    description: "Match related concepts together. Find the connections between ideas.",
    icon: Link,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "concept_tower" as const,
    name: "Concept Tower",
    description: "Build your knowledge tower! Answer increasingly difficult questions. Don't lose all your lives!",
    icon: Building2,
    color: "text-success",
    bg: "bg-success/10",
  },
];

interface GameSelectorProps {
  contentId: string;
}

export function GameSelector({ contentId }: GameSelectorProps) {
  const store = useGameStore();
  const startClash = useStartConceptClash(contentId);
  const startConnection = useStartConnectionGame(contentId);
  const startTower = useStartConceptTower(contentId);

  const handleStart = async (gameId: typeof GAMES[number]["id"]) => {
    try {
      if (gameId === "concept_clash") {
        const data = await startClash.mutateAsync();
        store.startClash(data.questions);
      } else if (gameId === "connection") {
        const data = await startConnection.mutateAsync();
        store.startConnection(data.pairs);
      } else if (gameId === "concept_tower") {
        const data = await startTower.mutateAsync();
        store.startTower(data.blocks, data.livesTotal);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start game";
      toastError("Error", msg);
    }
  };

  const isLoading = startClash.isPending || startConnection.isPending || startTower.isPending;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Choose a Game</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => handleStart(game.id)}
              disabled={isLoading}
              className="group rounded-xl border border-border bg-surface p-5 text-left transition-all hover:border-primary/40 hover:shadow-md disabled:opacity-50"
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${game.bg}`}>
                <Icon className={`h-6 w-6 ${game.color}`} />
              </div>
              <h4 className="font-semibold text-text-primary group-hover:text-primary">
                {game.name}
              </h4>
              <p className="mt-1 text-xs text-text-secondary">{game.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
