import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedDefaultUser, seedContent, seedConcept, seedFlashcard, seedUserProgress } from "@/test/db-helper";

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

function makeRequest() {
  return new Request("http://localhost/api/flashcards/due");
}

describe("GET /api/flashcards/due", () => {
  beforeEach(() => {
    testDb = createTestDb();
    seedDefaultUser(testDb.db);
  });

  it("returns zeros when user has no content", async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.dueCount).toBe(0);
    expect(data.totalCount).toBe(0);
  });

  it("counts all cards when none have progress", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "CNN", definition: "Convolutional network" });
    seedFlashcard(testDb.db, { id: "f1", contentId: "c1", conceptId: "con1", frontText: "What is CNN?", backText: "A type of neural network" });
    seedFlashcard(testDb.db, { id: "f2", contentId: "c1", conceptId: "con1", frontText: "What is RNN?", backText: "Recurrent neural network" });

    const res = await GET();
    const data = await res.json();
    expect(data.dueCount).toBe(2);
    expect(data.totalCount).toBe(2);
  });

  it("cards without conceptId are always due", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedFlashcard(testDb.db, { id: "f1", contentId: "c1", conceptId: null, frontText: "Q?", backText: "A" });

    const res = await GET();
    const data = await res.json();
    expect(data.dueCount).toBe(1);
  });

  it("cards with future nextReviewAt are not due", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "CNN", definition: "Conv net" });
    seedFlashcard(testDb.db, { id: "f1", contentId: "c1", conceptId: "con1", frontText: "Q?", backText: "A" });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    seedUserProgress(testDb.db, {
      id: "p1",
      userId: "default-user",
      contentId: "c1",
      conceptId: "con1",
      nextReviewAt: futureDate,
    });

    const res = await GET();
    const data = await res.json();
    expect(data.dueCount).toBe(0);
    expect(data.totalCount).toBe(1);
  });

  it("cards with past nextReviewAt are due", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "CNN", definition: "Conv net" });
    seedFlashcard(testDb.db, { id: "f1", contentId: "c1", conceptId: "con1", frontText: "Q?", backText: "A" });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    seedUserProgress(testDb.db, {
      id: "p1",
      userId: "default-user",
      contentId: "c1",
      conceptId: "con1",
      nextReviewAt: pastDate,
    });

    const res = await GET();
    const data = await res.json();
    expect(data.dueCount).toBe(1);
  });
});
