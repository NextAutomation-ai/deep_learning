"use client";

import { useDueCount } from "@/hooks/use-due-flashcards";
import { Brain } from "lucide-react";
import Link from "next/link";

export function DueCardsWidget() {
  const { data } = useDueCount();
  const dueCount = data?.dueCount ?? 0;

  return (
    <Link
      href="/review"
      className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-surface-hover"
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
        <Brain className="h-6 w-6 text-warning" />
        {dueCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {dueCount > 99 ? "99+" : dueCount}
          </span>
        )}
      </div>
      <div>
        <p className="font-medium text-text-primary">
          {dueCount > 0 ? `${dueCount} Cards Due` : "All Cards Reviewed"}
        </p>
        <p className="text-sm text-text-secondary">
          {dueCount > 0
            ? "Start spaced repetition review"
            : "Check back later"}
        </p>
      </div>
    </Link>
  );
}
