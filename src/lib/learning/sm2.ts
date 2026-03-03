// SuperMemo-2 (SM-2) spaced repetition algorithm

export type SM2Rating = 1 | 3 | 4 | 5;
// 1 = Again (did not remember)
// 3 = Hard (correct but difficult)
// 4 = Good (correct with slight hesitation)
// 5 = Easy (perfect instant recall)

export interface SM2State {
  easeFactor: number; // >= 1.3
  intervalDays: number;
  repetitions: number; // streak of correct reviews
}

export interface SM2Result extends SM2State {
  nextReviewAt: Date;
}

export function calculateSM2(
  current: SM2State,
  rating: SM2Rating
): SM2Result {
  let { easeFactor, intervalDays, repetitions } = current;

  if (rating >= 3) {
    // Correct response
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect — reset
    repetitions = 0;
    intervalDays = 1;
  }

  // Update ease factor (never below 1.3)
  easeFactor =
    easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    repetitions,
    nextReviewAt,
  };
}

/** Default SM2 state for a new card */
export function defaultSM2State(): SM2State {
  return { easeFactor: 2.5, intervalDays: 1, repetitions: 0 };
}
