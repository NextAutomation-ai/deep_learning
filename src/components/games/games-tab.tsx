"use client";

import { useGameStore } from "@/stores/game-store";
import { GameSelector } from "./game-selector";
import { ConceptClash } from "./concept-clash";
import { ConnectionGame } from "./connection-game";
import { ConceptTower } from "./concept-tower";
import { GameSummary } from "./game-summary";

interface GamesTabProps {
  contentId: string;
}

export function GamesTab({ contentId }: GamesTabProps) {
  const { activeGame, result, resetGame, isPlaying } = useGameStore();

  // Show summary if game finished with result
  if (result) {
    return (
      <GameSummary
        onPlayAgain={() => resetGame()}
        onBack={() => resetGame()}
      />
    );
  }

  // Show active game
  if (activeGame === "concept_clash") {
    return <ConceptClash contentId={contentId} />;
  }
  if (activeGame === "connection") {
    return <ConnectionGame contentId={contentId} />;
  }
  if (activeGame === "concept_tower") {
    return <ConceptTower contentId={contentId} />;
  }

  // Show game selector
  return <GameSelector contentId={contentId} />;
}
