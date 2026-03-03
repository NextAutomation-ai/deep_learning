import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedDefaultUser, seedContent } from "@/test/db-helper";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
}));

vi.mock("@/lib/auth/get-user", () => ({
  getUser: async () => ({ user: { id: "default-user", name: "Learner", email: "learner@deeplearn.local" } }),
}));

const { PATCH } = await import("./route");

function makeRequest() {
  return new Request("http://localhost/api/content/c1/favorite", { method: "PATCH" });
}

describe("PATCH /api/content/[contentId]/favorite", () => {
  beforeEach(() => {
    testDb = createTestDb();
    seedDefaultUser(testDb.db);
  });

  it("toggles favorite from 0 to 1", async () => {
    seedContent(testDb.db, { id: "c1", title: "Test Content", isFavorited: 0 });
    const res = await PATCH(
      makeRequest() as any,
      { params: Promise.resolve({ contentId: "c1" }) }
    );
    const data = await res.json();
    expect(data.isFavorited).toBe(1);
  });

  it("toggles favorite from 1 to 0", async () => {
    seedContent(testDb.db, { id: "c1", title: "Test Content", isFavorited: 1 });
    const res = await PATCH(
      makeRequest() as any,
      { params: Promise.resolve({ contentId: "c1" }) }
    );
    const data = await res.json();
    expect(data.isFavorited).toBe(0);
  });

  it("returns 404 for non-existent content", async () => {
    const res = await PATCH(
      makeRequest() as any,
      { params: Promise.resolve({ contentId: "nonexistent" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for other user's content", async () => {
    testDb.rawDb.exec(`
      INSERT INTO users (id, name, email) VALUES ('other-user', 'Other', 'other@test.com');
      INSERT INTO contents (id, user_id, title, source_type, processing_status, created_at, updated_at)
        VALUES ('c1', 'other-user', 'Other Content', 'pdf', 'completed', ${Date.now()}, ${Date.now()});
    `);
    const res = await PATCH(
      makeRequest() as any,
      { params: Promise.resolve({ contentId: "c1" }) }
    );
    expect(res.status).toBe(404);
  });
});
