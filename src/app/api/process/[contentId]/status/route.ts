import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;

  const [content] = await db
    .select({
      processingStatus: contents.processingStatus,
      processingProgress: contents.processingProgress,
      processingError: contents.processingError,
    })
    .from(contents)
    .where(eq(contents.id, contentId))
    .limit(1);

  if (!content) {
    return NextResponse.json(
      { error: "Content not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: content.processingStatus,
    progress: content.processingProgress ?? 0,
    message: content.processingError || content.processingStatus,
  });
}
