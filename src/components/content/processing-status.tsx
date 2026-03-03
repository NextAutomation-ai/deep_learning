"use client";

import { useProcessingStatus } from "@/hooks/use-processing-status";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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
  const message =
    liveStatus?.message || statusLabels[currentStatus] || currentStatus;

  const isCompleted = currentStatus === "completed";
  const isFailed = currentStatus === "failed";
  const isProcessing = !isCompleted && !isFailed;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isCompleted && (
          <CheckCircle className="h-4 w-4 text-success" />
        )}
        {isFailed && <XCircle className="h-4 w-4 text-danger" />}
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
          {message}
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
