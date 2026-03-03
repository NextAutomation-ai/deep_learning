"use client";

import { CheckCircle2, Lock, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Lesson {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: number;
  conceptIds: string[];
}

export function LessonCard({
  lesson,
  index,
  status,
  onClick,
}: {
  lesson: Lesson;
  index: number;
  status: "locked" | "available" | "completed";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === "locked"}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
        status === "completed" && "border-success/30 bg-success/5",
        status === "available" &&
          "border-primary/30 bg-primary/5 hover:shadow-md",
        status === "locked" && "cursor-not-allowed border-border bg-surface opacity-60"
      )}
    >
      {/* Number / Status Icon */}
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
          status === "completed" && "bg-success text-white",
          status === "available" && "bg-primary text-white",
          status === "locked" && "bg-border text-text-secondary"
        )}
      >
        {status === "completed" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : status === "locked" ? (
          <Lock className="h-4 w-4" />
        ) : (
          index + 1
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-text-primary">{lesson.title}</h3>
        <p className="mt-0.5 truncate text-sm text-text-secondary">
          {lesson.description}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-text-secondary">
          <span>{lesson.conceptIds.length} concepts</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lesson.estimatedMinutes} min
          </span>
          <span>Level {lesson.difficulty}/5</span>
        </div>
      </div>

      {status !== "locked" && (
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-text-secondary" />
      )}
    </button>
  );
}
