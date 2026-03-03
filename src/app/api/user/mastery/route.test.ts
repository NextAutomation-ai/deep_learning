import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedDefaultUser, seedContent, seedConcept, seedUserProgress } from "@/test/db-helper";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
}));

vi.mock("@/lib/auth/get-user", () => ({
  getUser: async () => ({ user: { id: "default-user", name: "Learner", email: "learner@deeplearn.local" } }),
}));

const { GET } = await import("./route");

describe("GET /api/user/mastery", () => {
  beforeEach(() => {
    testDb = createTestDb();
    seedDefaultUser(testDb.db);
  });

  it("returns all zeros when user has no content", async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.mastery).toEqual({
      notStarted: 0,
      learning: 0,
      practicing: 0,
      mastered: 0,
    });
  });

  it("counts concepts without progress as notStarted", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "CNN", definition: "Conv" });
    seedConcept(testDb.db, { id: "con2", contentId: "c1", name: "RNN", definition: "Recurrent" });

    const res = await GET();
    const data = await res.json();
    expect(data.mastery.notStarted).toBe(2);
  });

  it("mastery 0.3 goes into learning bucket", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "CNN", definition: "Conv" });
    seedUserProgress(testDb.db, {
      id: "p1",
      userId: "default-user",
      contentId: "c1",
      conceptId: "con1",
      masteryLevel: 0.3,
    });

    const res = await GET();
    const data = await res.json();
    expect(data.mastery.learning).toBe(1);
  });

  it("mastery 0.6 goes into practicing bucket", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "CNN", definition: "Conv" });
    seedUserProgress(testDb.db, {
      id: "p1",
      userId: "default-user",
      contentId: "c1",
      conceptId: "con1",
      masteryLevel: 0.6,
    });

    const res = await GET();
    const data = await res.json();
    expect(data.mastery.practicing).toBe(1);
  });

  it("mastery 0.9 goes into mastered bucket", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "CNN", definition: "Conv" });
    seedUserProgress(testDb.db, {
      id: "p1",
      userId: "default-user",
      contentId: "c1",
      conceptId: "con1",
      masteryLevel: 0.9,
    });

    const res = await GET();
    const data = await res.json();
    expect(data.mastery.mastered).toBe(1);
  });

  it("distributes mixed mastery levels correctly", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "A", definition: "D1" });
    seedConcept(testDb.db, { id: "con2", contentId: "c1", name: "B", definition: "D2" });
    seedConcept(testDb.db, { id: "con3", contentId: "c1", name: "C", definition: "D3" });
    seedConcept(testDb.db, { id: "con4", contentId: "c1", name: "D", definition: "D4" });

    seedUserProgress(testDb.db, { id: "p1", userId: "default-user", contentId: "c1", conceptId: "con1", masteryLevel: 0.2 });
    seedUserProgress(testDb.db, { id: "p2", userId: "default-user", contentId: "c1", conceptId: "con2", masteryLevel: 0.5 });
    seedUserProgress(testDb.db, { id: "p3", userId: "default-user", contentId: "c1", conceptId: "con3", masteryLevel: 0.85 });
    // con4 has no progress → notStarted

    const res = await GET();
    const data = await res.json();
    expect(data.mastery.notStarted).toBe(1);
    expect(data.mastery.learning).toBe(1);
    expect(data.mastery.practicing).toBe(1);
    expect(data.mastery.mastered).toBe(1);
  });
});
