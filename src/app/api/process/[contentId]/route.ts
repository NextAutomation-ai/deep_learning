import { NextRequest, NextResponse } from "next/server";
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
import { processingStatus } from "@/lib/processing/status";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await requireAuth();

  const { contentId } = await params;
  const body = await request.json().catch(() => ({}));
  const forceReprocess = (body as { force?: boolean }).force === true;

  // Verify ownership
  const content = db
    .select()
    .from(contents)
    .where(
      and(eq(contents.id, contentId), eq(contents.userId, session.user.id))
    )
    .get();

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    db.delete(flashcards).where(eq(flashcards.contentId, contentId)).run();
    db.delete(questions).where(eq(questions.contentId, contentId)).run();
    db.delete(arguments_).where(eq(arguments_.contentId, contentId)).run();
    db.delete(conceptRelationships)
      .where(eq(conceptRelationships.contentId, contentId))
      .run();
    db.delete(concepts).where(eq(concepts.contentId, contentId)).run();
    db.delete(contentChunks)
      .where(eq(contentChunks.contentId, contentId))
      .run();

    db.update(contents)
      .set({
        processingStatus: "pending",
        processingProgress: 0,
        processingError: null,
        totalChunks: 0,
        totalConcepts: 0,
        rawText: content.sourceType === "text" ? content.rawText : null,
      })
      .where(eq(contents.id, contentId))
      .run();
  }

  const emitter = processingStatus.createEmitter(contentId);

  // Fire and forget — processing runs in background
  processContent(contentId, emitter).catch((err) =>
    console.error(`Processing failed for ${contentId}:`, err)
  );

  return NextResponse.json({
    message: "Processing started",
    contentId,
  });
}
