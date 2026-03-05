"use client";

import { useProcessingStatus } from "@/hooks/use-processing-status";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const statusLabels: Record<string, string> = {
  pending: "Waiting to start...",
  extracting: "Extracting text...",
  chunking: "Splitting into sections...",
  analyzing: "Analyzing concepts...",
  generating: "Generating quizzes & flashcards...",
  completed: "Processing complete!",
  failed: "Processing failed",
};

function getFriendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("limit") || lower.includes("quota") || lower.includes("429"))
    return "AI usage limit reached. Please wait a few minutes and try again.";
  if (lower.includes("unavailable") || lower.includes("all ai"))
    return "AI service is temporarily unavailable. Please try again in a few minutes.";
  if (lower.includes("no text") || lower.includes("could not be extracted"))
    return "We couldn't read any text from this file. Please try a different file.";
  if (lower.includes("not found"))
    return "This content could not be found.";
  if (lower.includes("timeout") || lower.includes("timed out"))
    return "Processing took too long. Please try again with a smaller file.";
  // Already user-friendly
  if (!message.includes("Error:") && !message.includes("at ") && !message.includes("ENOENT")) {
    return message;
  }
  return "Something went wrong during processing. Please try again.";
}

export function ProcessingStatusBar({
  contentId,
  initialStatus,
  initialProgress,
}: {
  contentId: string;
  initialStatus?: string;
  initialProgress?: number;
}) {
  const { status: liveStatus } = useProcessingStatus(
    initialStatus !== "completed" && initialStatus !== "failed"
      ? contentId
      : null
  );

  const currentStatus = liveStatus?.status || initialStatus || "pending";
  const currentProgress = liveStatus?.progress || initialProgress || 0;

  const isCompleted = currentStatus === "completed";
  const isFailed = currentStatus === "failed";
  const isProcessing = !isCompleted && !isFailed;

  const displayMessage = isFailed
    ? getFriendlyError(liveStatus?.message || "Processing failed")
    : statusLabels[currentStatus] || currentStatus;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isCompleted && (
          <CheckCircle className="h-4 w-4 text-success" />
        )}
        {isFailed && <AlertTriangle className="h-4 w-4 text-danger" />}
        {isProcessing && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        <span
          className={cn(
            "text-xs font-medium",
            isCompleted && "text-success",
            isFailed && "text-danger",
            isProcessing && "text-primary"
          )}
        >
          {displayMessage}
        </span>
      </div>

      {isProcessing && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
