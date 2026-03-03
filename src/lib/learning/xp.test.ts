import { describe, it, expect } from "vitest";
import {
  getLevelInfo,
  calculateQuizXp,
  XP_REWARDS,
  LEVEL_THRESHOLDS,
} from "./xp";

describe("getLevelInfo", () => {
  it("returns level 1 Novice for 0 XP", () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.name).toBe("Novice");
    expect(info.totalXp).toBe(0);
  });

  it("returns level 2 Learner for 100 XP", () => {
    const info = getLevelInfo(100);
    expect(info.level).toBe(2);
    expect(info.name).toBe("Learner");
  });

  it("returns level 2 for 200 XP (midway)", () => {
    const info = getLevelInfo(200);
    expect(info.level).toBe(2);
    expect(info.name).toBe("Learner");
    expect(info.xpInLevel).toBe(100); // 200 - 100
  });

  it("returns level 5 for exactly 1000 XP", () => {
    const info = getLevelInfo(1000);
    expect(info.level).toBe(5);
    expect(info.name).toBe("Analyst");
  });

  it("returns max level for 10000+ XP", () => {
    const info = getLevelInfo(15000);
    expect(info.level).toBe(10);
    expect(info.name).toBe("Enlightened");
  });

  it("progress is 0 at start of level", () => {
    const info = getLevelInfo(300); // Exactly level 3 start
    expect(info.progress).toBe(0);
  });

  it("progress is between 0 and 1 mid-level", () => {
    const info = getLevelInfo(450); // Midway through level 3 (300-600)
    expect(info.progress).toBeGreaterThan(0);
    expect(info.progress).toBeLessThan(1);
    expect(info.progress).toBe(0.5); // (450-300)/(600-300)
  });

  it("progress caps at 1 at max level", () => {
    const info = getLevelInfo(99999);
    expect(info.progress).toBe(1);
  });

  it("nextLevelName is correct", () => {
    const info = getLevelInfo(0);
    expect(info.nextLevelName).toBe("Learner");
  });

  it("includes all expected fields", () => {
    const info = getLevelInfo(500);
    expect(info).toHaveProperty("level");
    expect(info).toHaveProperty("name");
    expect(info).toHaveProperty("totalXp");
    expect(info).toHaveProperty("xpInLevel");
    expect(info).toHaveProperty("xpForNextLevel");
    expect(info).toHaveProperty("progress");
    expect(info).toHaveProperty("nextLevelName");
  });
});

describe("calculateQuizXp", () => {
  it("returns boss_battle XP for 70%+ in boss mode", () => {
    const xp = calculateQuizXp(7, 10, "boss_battle");
    expect(xp).toBe(XP_REWARDS.boss_battle);
  });

  it("returns scaled XP for below 70% in boss mode", () => {
    const xp = calculateQuizXp(5, 10, "boss_battle");
    expect(xp).toBe(Math.round(0.5 * 100)); // 50
  });

  it("returns scaled XP for speed_round mode", () => {
    const xp = calculateQuizXp(8, 10, "speed_round");
    expect(xp).toBe(Math.round(0.8 * 80)); // 64
  });

  it("returns excellent XP for 90%+ in normal mode", () => {
    const xp = calculateQuizXp(9, 10, "normal");
    expect(xp).toBe(XP_REWARDS.chapter_quiz_excellent);
  });

  it("returns pass XP for 70-89% in normal mode", () => {
    const xp = calculateQuizXp(7, 10, "normal");
    expect(xp).toBe(XP_REWARDS.chapter_quiz_pass);
  });

  it("returns scaled XP for below 70% in normal mode", () => {
    const xp = calculateQuizXp(5, 10, "normal");
    expect(xp).toBe(Math.round(0.5 * 40)); // 20
  });

  it("adds perfect score bonus for 100%", () => {
    const xp = calculateQuizXp(10, 10, "normal");
    expect(xp).toBe(XP_REWARDS.chapter_quiz_excellent + XP_REWARDS.perfect_score);
  });

  it("adds perfect score bonus in boss mode too", () => {
    const xp = calculateQuizXp(10, 10, "boss_battle");
    expect(xp).toBe(XP_REWARDS.boss_battle + XP_REWARDS.perfect_score);
  });

  it("returns 0 XP for 0 score", () => {
    const xp = calculateQuizXp(0, 10, "normal");
    expect(xp).toBe(0);
  });

  it("handles maxScore of 0 without division by zero", () => {
    const xp = calculateQuizXp(0, 0, "normal");
    expect(xp).toBe(0);
  });
});
