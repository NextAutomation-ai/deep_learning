import { XP_REWARDS } from "@/lib/learning/xp";

export interface GameResult {
  gameType: string;
  score: number;
  maxScore: number;
  xpEarned: number;
  streakBonus: number;
  newBadges: string[];
  correct: number;
  total: number;
}

/**
 * Fisher-Yates shuffle.
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calculate XP for a game based on type and score.
 */
export function calculateGameXp(
  gameType: string,
  score: number,
  maxScore: number
): number {
  const pct = maxScore > 0 ? score / maxScore : 0;

  let baseXp: number;
  switch (gameType) {
    case "concept_clash":
      baseXp = XP_REWARDS.game_concept_clash;
      break;
    case "connection":
      baseXp = XP_REWARDS.game_connection;
      break;
    case "concept_tower":
      baseXp = XP_REWARDS.game_concept_tower;
      break;
    default:
      baseXp = 50;
  }

  return Math.round(baseXp * pct);
}

/**
 * Calculate Concept Clash streak multiplier.
 * 2x after 3 consecutive correct, 3x after 5, 4x after 8.
 */
export function getStreakMultiplier(consecutiveCorrect: number): number {
  if (consecutiveCorrect >= 8) return 4;
  if (consecutiveCorrect >= 5) return 3;
  if (consecutiveCorrect >= 3) return 2;
  return 1;
}
