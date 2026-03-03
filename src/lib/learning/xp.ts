// XP and level calculation helpers

export const XP_REWARDS = {
  flashcard_review: 5,
  lesson_complete: 30,
  chapter_quiz_pass: 50,
  chapter_quiz_excellent: 100, // 90%+
  boss_battle: 200,
  perfect_score: 50,
  daily_login: 10,
  socratic_session: 75,
  argument_mapping: 30,
  devils_advocate: 100,
  bias_detection: 50,
  teach_back: 100,
  game_concept_clash: 80,
  game_connection: 60,
  game_concept_tower: 100,
} as const;

export const LEVEL_THRESHOLDS: readonly { level: number; name: string; xp: number }[] = [
  { level: 1, name: "Novice", xp: 0 },
  { level: 2, name: "Learner", xp: 100 },
  { level: 3, name: "Student", xp: 300 },
  { level: 4, name: "Scholar", xp: 600 },
  { level: 5, name: "Analyst", xp: 1000 },
  { level: 6, name: "Thinker", xp: 1500 },
  { level: 7, name: "Expert", xp: 2500 },
  { level: 8, name: "Master", xp: 4000 },
  { level: 9, name: "Sage", xp: 6000 },
  { level: 10, name: "Enlightened", xp: 10000 },
];

/** Get user's level and progress based on total XP */
export function getLevelInfo(totalXp: number) {
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].xp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
      break;
    }
  }

  const xpInLevel = totalXp - current.xp;
  const xpForNextLevel = next.xp - current.xp;
  const progress = xpForNextLevel > 0 ? xpInLevel / xpForNextLevel : 1;

  return {
    level: current.level,
    name: current.name,
    totalXp,
    xpInLevel,
    xpForNextLevel,
    progress: Math.min(progress, 1),
    nextLevelName: next.name,
  };
}

/** Calculate quiz XP based on score and mode */
export function calculateQuizXp(
  score: number,
  maxScore: number,
  mode: string
): number {
  const pct = maxScore > 0 ? score / maxScore : 0;
  let xp = 0;

  if (mode === "boss_battle") {
    xp = pct >= 0.7 ? XP_REWARDS.boss_battle : Math.round(pct * 100);
  } else if (mode === "speed_round") {
    xp = Math.round(pct * 80);
  } else {
    if (pct >= 0.9) xp = XP_REWARDS.chapter_quiz_excellent;
    else if (pct >= 0.7) xp = XP_REWARDS.chapter_quiz_pass;
    else xp = Math.round(pct * 40);
  }

  if (pct === 1) xp += XP_REWARDS.perfect_score;
  return xp;
}
