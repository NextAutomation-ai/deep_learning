export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { requireAuth } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import {
  contents,
  contentChunks,
  concepts,
  conceptRelationships,
  questions,
  flashcards,
  arguments_,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { processContent } from "@/lib/processing/pipeline";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await requireAuth();

  const { contentId } = await params;
  const body = await request.json().catch(() => ({}));
  const forceReprocess = (body as { force?: boolean }).force === true;

  // Verify ownership
  const content = (await db
    .select()
    .from(contents)
    .where(
      and(eq(contents.id, contentId), eq(contents.userId, session.user.id))
    )
    .limit(1))[0];

  if (!content) {
    return NextResponse.json(
      { error: "Content not found." },
      { status: 404 }
    );
  }

  if (
    content.processingStatus === "completed" &&
    (content.totalConcepts ?? 0) > 0 &&
    !forceReprocess
  ) {
    return NextResponse.json({ message: "Already processed" });
  }

  // If reprocessing, clean up old generated data
  if (
    content.processingStatus === "completed" ||
    content.processingStatus === "failed"
  ) {
    await db.delete(flashcards).where(eq(flashcards.contentId, contentId));
    await db.delete(questions).where(eq(questions.contentId, contentId));
    await db.delete(arguments_).where(eq(arguments_.contentId, contentId));
    await db.delete(conceptRelationships)
      .where(eq(conceptRelationships.contentId, contentId));
    await db.delete(concepts).where(eq(concepts.contentId, contentId));
    await db.delete(contentChunks)
      .where(eq(contentChunks.contentId, contentId));

    await db.update(contents)
      .set({
        processingStatus: "pending",
        processingProgress: 0,
        processingError: null,
        totalChunks: 0,
        totalConcepts: 0,
        rawText: content.sourceType === "text" ? content.rawText : null,
      })
      .where(eq(contents.id, contentId));
  }

  // Use waitUntil to keep the serverless function alive while processing runs
  // The pipeline updates the database with progress, so the status route can poll it
  waitUntil(
    processContent(contentId).catch((err) =>
      console.error(`Processing failed for ${contentId}:`, err)
    )
  );

  return NextResponse.json({
    message: "Processing started",
    contentId,
  });
}
