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

const { GET } = await import("./route");

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/content");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const req = new Request(url);
  Object.defineProperty(req, "nextUrl", { value: url });
  return req;
}

describe("GET /api/content", () => {
  beforeEach(() => {
    testDb = createTestDb();
    seedDefaultUser(testDb.db);
  });

  it("returns all user content", async () => {
    seedContent(testDb.db, { id: "c1", title: "Content 1" });
    seedContent(testDb.db, { id: "c2", title: "Content 2" });
    const res = await GET(makeRequest() as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(2);
    expect(data.totalCount).toBe(2);
  });

  it("returns empty array when user has no content", async () => {
    const res = await GET(makeRequest() as any);
    const data = await res.json();
    expect(data.contents).toEqual([]);
    expect(data.totalCount).toBe(0);
  });

  it("filters by type", async () => {
    seedContent(testDb.db, { id: "c1", title: "PDF File", sourceType: "pdf" });
    seedContent(testDb.db, { id: "c2", title: "Web Page", sourceType: "url" });
    const res = await GET(makeRequest({ type: "pdf" }) as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(1);
    expect(data.contents[0].title).toBe("PDF File");
  });

  it("filters by status (completed)", async () => {
    seedContent(testDb.db, { id: "c1", title: "Done", processingStatus: "completed" });
    seedContent(testDb.db, { id: "c2", title: "In Progress", processingStatus: "pending" });
    const res = await GET(makeRequest({ status: "completed" }) as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(1);
    expect(data.contents[0].title).toBe("Done");
  });

  it("filters by status (processing) matches multiple statuses", async () => {
    seedContent(testDb.db, { id: "c1", title: "Pending", processingStatus: "pending" });
    seedContent(testDb.db, { id: "c2", title: "Extracting", processingStatus: "extracting" });
    seedContent(testDb.db, { id: "c3", title: "Done", processingStatus: "completed" });
    const res = await GET(makeRequest({ status: "processing" }) as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(2);
  });

  it("searches by title query", async () => {
    seedContent(testDb.db, { id: "c1", title: "Machine Learning Guide" });
    seedContent(testDb.db, { id: "c2", title: "Cooking Recipes" });
    const res = await GET(makeRequest({ q: "Machine" }) as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(1);
    expect(data.contents[0].title).toBe("Machine Learning Guide");
  });

  it("sorts by oldest", async () => {
    seedContent(testDb.db, { id: "c1", title: "Old", createdAt: new Date(1000) });
    seedContent(testDb.db, { id: "c2", title: "New", createdAt: new Date(2000) });
    const res = await GET(makeRequest({ sort: "oldest" }) as any);
    const data = await res.json();
    expect(data.contents[0].title).toBe("Old");
  });

  it("sorts by A-Z", async () => {
    seedContent(testDb.db, { id: "c1", title: "Zebra" });
    seedContent(testDb.db, { id: "c2", title: "Apple" });
    const res = await GET(makeRequest({ sort: "az" }) as any);
    const data = await res.json();
    expect(data.contents[0].title).toBe("Apple");
    expect(data.contents[1].title).toBe("Zebra");
  });

  it("filters favorites", async () => {
    seedContent(testDb.db, { id: "c1", title: "Fav", isFavorited: 1 });
    seedContent(testDb.db, { id: "c2", title: "Not Fav", isFavorited: 0 });
    const res = await GET(makeRequest({ favorites: "1" }) as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(1);
    expect(data.contents[0].title).toBe("Fav");
  });

  it("totalCount reflects unfiltered count", async () => {
    seedContent(testDb.db, { id: "c1", title: "PDF", sourceType: "pdf" });
    seedContent(testDb.db, { id: "c2", title: "URL", sourceType: "url" });
    const res = await GET(makeRequest({ type: "pdf" }) as any);
    const data = await res.json();
    expect(data.contents).toHaveLength(1);
    expect(data.totalCount).toBe(2); // Unfiltered total
  });
});
