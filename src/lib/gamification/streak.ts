export const STREAK_MILESTONES = [7, 30, 100, 365] as const;

/**
 * Calculate XP bonus based on streak length.
 * Formula: 5 * streakLength XP daily bonus.
 */
export function calculateStreakBonus(streakLength: number): number {
  return 5 * streakLength;
}

/**
 * Returns the milestone number if the streak just hit one, else null.
 */
export function getStreakMilestone(streakLength: number): number | null {
  if (STREAK_MILESTONES.includes(streakLength as 7 | 30 | 100 | 365)) {
    return streakLength;
  }
  return null;
}

/**
 * Get the next streak milestone and progress toward it.
 */
export function getNextMilestone(currentStreak: number): {
  next: number;
  progress: number;
} {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone) {
      return {
        next: milestone,
        progress: currentStreak / milestone,
      };
    }
  }
  // Past all milestones
  return { next: 365, progress: 1 };
}
