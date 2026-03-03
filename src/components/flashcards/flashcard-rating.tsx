"use client";

import { cn } from "@/lib/utils/cn";
import { useEffect } from "react";

const ratings = [
  { value: 1 as const, label: "Again", sublabel: "Didn't remember", color: "text-danger", key: "1" },
  { value: 3 as const, label: "Hard", sublabel: "Struggled", color: "text-warning", key: "2" },
  { value: 4 as const, label: "Good", sublabel: "Recalled well", color: "text-primary", key: "3" },
  { value: 5 as const, label: "Easy", sublabel: "Instant recall", color: "text-success", key: "4" },
];

export function FlashcardRating({
  onRate,
}: {
  onRate: (rating: 1 | 3 | 4 | 5) => void;
}) {
  // Keyboard shortcuts: 1-4
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < ratings.length) {
        onRate(ratings[idx].value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRate]);

  return (
    <div className="flex gap-2">
      {ratings.map((r) => (
        <button
          key={r.value}
          onClick={() => onRate(r.value)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-lg border border-border p-3 transition-colors hover:bg-surface-hover"
          )}
        >
          <span className={cn("text-sm font-semibold", r.color)}>{r.label}</span>
          <span className="text-[10px] text-text-secondary">{r.sublabel}</span>
          <kbd className="mt-1 rounded bg-background px-1.5 py-0.5 text-[10px] text-text-secondary">
            {r.key}
          </kbd>
        </button>
      ))}
    </div>
  );
}
