import { db } from "@/lib/db";
import {
  userStats,
  quizAttempts,
  contents,
  userProgress,
  learningSessions,
  socraticSessions,
  devilsAdvocateDebates,
  biasDetectionExercises,
  teachBackResponses,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { BADGE_MAP } from "./badges";

export type BadgeTrigger =
  | "quiz_completed"
  | "lesson_completed"
  | "streak_updated"
  | "game_completed"
  | "thinking_completed"
  | "content_uploaded"
  | "concept_mastered";

/**
 * Checks if the user has earned any new badges based on the trigger event.
 * Returns array of newly earned badge IDs.
 */
export async function checkBadges(userId: string, trigger: BadgeTrigger): Promise<string[]> {
  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  if (!stats) return [];

  const earnedBadges = (stats.badges as string[]) || [];
  const newBadges: string[] = [];

  const check = (id: string, condition: () => boolean) => {
    if (BADGE_MAP[id] && !earnedBadges.includes(id) && condition()) {
      newBadges.push(id);
    }
  };

  if (trigger === "quiz_completed") {
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));

    check("quiz_whiz", () => attempts.some((a) => a.score === a.maxScore && (a.maxScore ?? 0) > 0));
    check("quiz_master", () => attempts.length >= 50);
    check("speed_demon", () =>
      attempts.some((a) => a.quizType === "speed_round" && (a.maxScore ?? 0) > 0 && (a.score ?? 0) / (a.maxScore ?? 1) >= 0.8)
    );
    check("boss_slayer", () =>
      attempts.some((a) => a.quizType === "boss_battle" && (a.maxScore ?? 0) > 0 && (a.score ?? 0) / (a.maxScore ?? 1) >= 0.7)
    );
    check("perfectionist", () =>
      attempts.filter((a) => a.score === a.maxScore && (a.maxScore ?? 0) > 0).length >= 5
    );
  }

  if (trigger === "lesson_completed") {
    const sessions = await db
      .select()
      .from(learningSessions)
      .where(and(eq(learningSessions.userId, userId), eq(learningSessions.sessionType, "reading")));

    check("first_steps", () => sessions.length >= 1);
  }

  if (trigger === "content_uploaded") {
    const userContents = await db
      .select()
      .from(contents)
      .where(eq(contents.userId, userId));

    check("bookworm", () => userContents.length >= 5);
  }

  if (trigger === "concept_mastered") {
    const mastered = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const masteredFiltered = mastered.filter((p) => (p.masteryLevel ?? 0) >= 0.8);
    check("concept_collector", () => masteredFiltered.length >= 25);
    check("knowledge_seeker", () => masteredFiltered.length >= 100);
  }

  if (trigger === "thinking_completed") {
    const socratic = await db
      .select()
      .from(socraticSessions)
      .where(and(eq(socraticSessions.userId, userId), eq(socraticSessions.status, "completed")));

    const debates = await db
      .select()
      .from(devilsAdvocateDebates)
      .where(and(eq(devilsAdvocateDebates.userId, userId), eq(devilsAdvocateDebates.status, "completed")));

    const biasExercises = await db
      .select()
      .from(biasDetectionExercises)
      .where(eq(biasDetectionExercises.userId, userId));
    const completedBias = biasExercises.filter((e) => e.completedAt !== null);

    const teachBacks = await db
      .select()
      .from(teachBackResponses)
      .where(eq(teachBackResponses.userId, userId));

    check("philosopher", () => socratic.length >= 10);
    check("devils_disciple", () => debates.length >= 5);
    check("bias_buster", () => completedBias.length >= 5);
    check("teacher", () => teachBacks.length >= 10);
  }

  if (trigger === "streak_updated") {
    const streak = stats.currentStreak ?? 0;
    check("consistent", () => streak >= 7);
    check("dedicated", () => streak >= 30);
    check("unstoppable", () => streak >= 100);
    check("legendary", () => streak >= 365);
  }

  if (trigger === "game_completed") {
    const gameSessions = await db
      .select()
      .from(learningSessions)
      .where(and(eq(learningSessions.userId, userId), eq(learningSessions.sessionType, "game")));

    check("clash_champion", () =>
      gameSessions.some((s) => {
        const meta = s.conceptsCovered as unknown as { gameType?: string; scorePercent?: number } | null;
        return meta?.gameType === "concept_clash" && (meta?.scorePercent ?? 0) >= 0.8;
      })
    );

    const connectionWins = gameSessions.filter((s) => {
      const meta = s.conceptsCovered as unknown as { gameType?: string; won?: boolean } | null;
      return meta?.gameType === "connection" && meta?.won;
    });
    check("connection_master", () => connectionWins.length >= 5);

    const towerCompletes = gameSessions.filter((s) => {
      const meta = s.conceptsCovered as unknown as { gameType?: string; won?: boolean } | null;
      return meta?.gameType === "concept_tower" && meta?.won;
    });
    check("tower_builder", () => towerCompletes.length >= 3);
  }

  return newBadges;
}

/**
 * Awards badges to a user by appending to their badges array.
 */
export async function awardBadges(userId: string, newBadgeIds: string[]): Promise<void> {
  if (newBadgeIds.length === 0) return;

  const [stats] = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  if (!stats) return;

  const currentBadges = (stats.badges as string[]) || [];
  const updatedBadges = [...currentBadges, ...newBadgeIds];

  await db.update(userStats)
    .set({ badges: updatedBadges, updatedAt: new Date() })
    .where(eq(userStats.id, stats.id));
}
