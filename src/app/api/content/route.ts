import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getUser();
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const type = sp.get("type");
  const status = sp.get("status");
  const sort = sp.get("sort") || "newest";
  const favorites = sp.get("favorites");

  // Build filter conditions
  const conditions = [eq(contents.userId, session.user.id)];

  if (q) {
    conditions.push(
      or(like(contents.title, `%${q}%`), like(contents.description, `%${q}%`))!
    );
  }
  if (type && type !== "all") {
    conditions.push(
      eq(
        contents.sourceType,
        type as "pdf" | "docx" | "url" | "text" | "youtube" | "epub" | "txt"
      )
    );
  }
  if (status && status !== "all") {
    if (status === "processing") {
      conditions.push(
        or(
          eq(contents.processingStatus, "pending"),
          eq(contents.processingStatus, "extracting"),
          eq(contents.processingStatus, "chunking"),
          eq(contents.processingStatus, "analyzing"),
          eq(contents.processingStatus, "generating")
        )!
      );
    } else {
      conditions.push(
        eq(
          contents.processingStatus,
          status as "completed" | "failed" | "pending"
        )
      );
    }
  }
  if (favorites === "1") {
    conditions.push(eq(contents.isFavorited, 1));
  }

  // Sort
  const orderBy =
    sort === "oldest"
      ? asc(contents.createdAt)
      : sort === "az"
        ? asc(contents.title)
        : sort === "za"
          ? desc(contents.title)
          : sort === "concepts"
            ? desc(contents.totalConcepts)
            : desc(contents.createdAt);

  const userContents = db
    .select()
    .from(contents)
    .where(and(...conditions))
    .orderBy(orderBy)
    .all();

  // Get total count (unfiltered) for UI
  const totalCount = db
    .select({ count: sql<number>`count(*)` })
    .from(contents)
    .where(eq(contents.userId, session.user.id))
    .get()?.count ?? 0;

  return NextResponse.json({ contents: userContents, totalCount });
}
