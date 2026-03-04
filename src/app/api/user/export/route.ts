import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import {
  contents,
  userProgress,
  quizAttempts,
  userStats,
  flashcards,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getUser();
  const userId = session.user.id;

  const userContents = await db
    .select()
    .from(contents)
    .where(eq(contents.userId, userId));

  const progress = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const quizzes = await db
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.userId, userId));

  const stats = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId));

  const contentIds = userContents.map((c) => c.id);
  const allFlashcards = await db.select().from(flashcards);
  const userFlashcards = allFlashcards.filter((f) =>
    contentIds.includes(f.contentId)
  );

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      name: session.user.name,
      email: session.user.email,
    },
    stats: stats[0] || null,
    contents: userContents.map((c) => ({
      id: c.id,
      title: c.title,
      sourceType: c.sourceType,
      totalConcepts: c.totalConcepts,
      totalChunks: c.totalChunks,
      processingStatus: c.processingStatus,
      createdAt: c.createdAt,
    })),
    progress,
    quizAttempts: quizzes,
    flashcards: userFlashcards,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="deeplearn-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
