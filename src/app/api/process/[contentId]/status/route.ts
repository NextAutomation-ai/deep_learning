import { NextRequest } from "next/server";
import { processingStatus } from "@/lib/processing/status";
import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {

  const { contentId } = await params;

  // Check current status first
  const content = (await db
    .select()
    .from(contents)
    .where(eq(contents.id, contentId))
    .limit(1))[0];

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: { status: string; progress: number | null; message?: string }) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream may be closed
        }
      };

      // Send current status immediately
      if (content) {
        send({
          status: content.processingStatus,
          progress: content.processingProgress,
          message: `Current status: ${content.processingStatus}`,
        });

        // If already completed or failed, close immediately
        if (
          content.processingStatus === "completed" ||
          content.processingStatus === "failed"
        ) {
          controller.close();
          return;
        }
      }

      // Subscribe to live updates
      const unsubscribe = processingStatus.subscribe(contentId, (event) => {
        send(event);
        if (event.status === "completed" || event.status === "failed") {
          setTimeout(() => {
            try {
              controller.close();
            } catch {
              // Already closed
            }
          }, 100);
        }
      });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
