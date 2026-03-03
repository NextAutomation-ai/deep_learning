import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedDefaultUser, seedContent, seedConcept, seedFlashcard } from "@/test/db-helper";

// Mock the db module before importing the route
let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
}));

vi.mock("@/lib/auth/get-user", () => ({
  getUser: async () => ({ user: { id: "default-user", name: "Learner", email: "learner@deeplearn.local" } }),
}));

// Import after mocks
const { GET } = await import("./route");

function makeRequest(q?: string) {
  const url = new URL("http://localhost/api/search");
  if (q) url.searchParams.set("q", q);
  const req = new Request(url);
  // NextRequest has a nextUrl property with searchParams
  Object.defineProperty(req, "nextUrl", { value: url });
  return req;
}

describe("GET /api/search", () => {
  beforeEach(() => {
    testDb = createTestDb();
    seedDefaultUser(testDb.db);
  });

  it("returns empty results when query is missing", async () => {
    const res = await GET(makeRequest() as any);
    const data = await res.json();
    expect(data.contents).toEqual([]);
    expect(data.concepts).toEqual([]);
    expect(data.flashcards).toEqual([]);
  });

  it("returns empty results when query is too short", async () => {
    const res = await GET(makeRequest("a") as any);
    const data = await res.json();
    expect(data.contents).toEqual([]);
  });

  it("finds content by title", async () => {
    seedContent(testDb.db, { id: "c1", title: "Machine Learning Basics", processingStatus: "completed" });
    const res = await GET(makeRequest("Machine") as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(1);
    expect(data.contents[0].title).toBe("Machine Learning Basics");
  });

  it("only returns completed content", async () => {
    seedContent(testDb.db, { id: "c1", title: "Machine Learning", processingStatus: "completed" });
    seedContent(testDb.db, { id: "c2", title: "Machine Vision", processingStatus: "pending" });
    const res = await GET(makeRequest("Machine") as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(1);
    expect(data.contents[0].title).toBe("Machine Learning");
  });

  it("finds concepts by name", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML Basics", processingStatus: "completed" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "Neural Network", definition: "A computational model" });
    const res = await GET(makeRequest("Neural") as any);
    const data = await res.json();
    expect(data.concepts).toHaveLength(1);
    expect(data.concepts[0].name).toBe("Neural Network");
  });

  it("finds flashcards by front text", async () => {
    seedContent(testDb.db, { id: "c1", title: "ML Basics", processingStatus: "completed" });
    seedFlashcard(testDb.db, { id: "f1", contentId: "c1", frontText: "What is gradient descent?", backText: "An optimization algorithm" });
    const res = await GET(makeRequest("gradient") as any);
    const data = await res.json();
    expect(data.flashcards).toHaveLength(1);
    expect(data.flashcards[0].frontText).toContain("gradient");
  });

  it("does not return other users' content", async () => {
    // Insert content for a different user
    testDb.rawDb.exec(`
      INSERT INTO users (id, name, email) VALUES ('other-user', 'Other', 'other@test.com');
      INSERT INTO contents (id, user_id, title, source_type, processing_status, created_at, updated_at)
        VALUES ('c-other', 'other-user', 'Private Content', 'pdf', 'completed', ${Date.now()}, ${Date.now()});
    `);
    const res = await GET(makeRequest("Private") as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(0);
  });

  it("returns results across all three categories", async () => {
    seedContent(testDb.db, { id: "c1", title: "Deep Learning Guide", processingStatus: "completed" });
    seedConcept(testDb.db, { id: "con1", contentId: "c1", name: "Deep Neural Network", definition: "Multi-layer network" });
    seedFlashcard(testDb.db, { id: "f1", contentId: "c1", frontText: "What is Deep Learning?", backText: "ML with neural networks" });
    const res = await GET(makeRequest("Deep") as any);
    const data = await res.json();
    expect(data.contents.length).toBeGreaterThanOrEqual(1);
    expect(data.concepts.length).toBeGreaterThanOrEqual(1);
    expect(data.flashcards.length).toBeGreaterThanOrEqual(1);
  });
});
