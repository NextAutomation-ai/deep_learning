import { describe, it, expect } from "vitest";
import { calculateSM2, defaultSM2State, type SM2State } from "./sm2";

describe("defaultSM2State", () => {
  it("returns correct defaults", () => {
    const state = defaultSM2State();
    expect(state).toEqual({
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 0,
    });
  });
});

describe("calculateSM2", () => {
  it("rating 1 (Again) resets repetitions and sets interval to 1", () => {
    const state: SM2State = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    const result = calculateSM2(state, 1);
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it("rating 3 (Hard) on first review sets interval to 1", () => {
    const state = defaultSM2State();
    const result = calculateSM2(state, 3);
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
  });

  it("rating 3 (Hard) on second review sets interval to 6", () => {
    const state: SM2State = { easeFactor: 2.5, intervalDays: 1, repetitions: 1 };
    const result = calculateSM2(state, 3);
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(6);
  });

  it("rating 5 (Easy) on first review sets interval to 1", () => {
    const state = defaultSM2State();
    const result = calculateSM2(state, 5);
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
  });

  it("rating 5 (Easy) on second review sets interval to 6", () => {
    const state: SM2State = { easeFactor: 2.5, intervalDays: 1, repetitions: 1 };
    const result = calculateSM2(state, 5);
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(6);
  });

  it("rating 5 (Easy) on third review multiplies interval by ease factor", () => {
    const state: SM2State = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    const result = calculateSM2(state, 5);
    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(15); // Math.round(6 * 2.5) = 15
  });

  it("ease factor increases with rating 5", () => {
    const state: SM2State = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    const result = calculateSM2(state, 5);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it("ease factor decreases with rating 3", () => {
    const state: SM2State = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    const result = calculateSM2(state, 3);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it("ease factor never drops below 1.3", () => {
    let state: SM2State = { easeFactor: 1.3, intervalDays: 1, repetitions: 0 };
    // Multiple failures should keep ease at 1.3
    for (let i = 0; i < 5; i++) {
      const result = calculateSM2(state, 1);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      state = {
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        repetitions: result.repetitions,
      };
    }
  });

  it("multiple consecutive perfect ratings increase interval progressively", () => {
    let state = defaultSM2State();
    const intervals: number[] = [];

    for (let i = 0; i < 5; i++) {
      const result = calculateSM2(state, 5);
      intervals.push(result.intervalDays);
      state = {
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        repetitions: result.repetitions,
      };
    }

    // After first 2 reviews (interval 1, 6), subsequent intervals should grow
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    expect(intervals[2]).toBeGreaterThan(intervals[1]);
    expect(intervals[3]).toBeGreaterThan(intervals[2]);
  });

  it("multiple consecutive failures keep interval at 1", () => {
    let state: SM2State = { easeFactor: 2.5, intervalDays: 10, repetitions: 3 };
    for (let i = 0; i < 3; i++) {
      const result = calculateSM2(state, 1);
      expect(result.intervalDays).toBe(1);
      expect(result.repetitions).toBe(0);
      state = {
        easeFactor: result.easeFactor,
        intervalDays: result.intervalDays,
        repetitions: result.repetitions,
      };
    }
  });

  it("returns a nextReviewAt date in the future", () => {
    const state = defaultSM2State();
    const now = new Date();
    const result = calculateSM2(state, 5);
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it("rounds ease factor to 2 decimal places", () => {
    const state: SM2State = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };
    const result = calculateSM2(state, 4);
    const decimals = result.easeFactor.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});
