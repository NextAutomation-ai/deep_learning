"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useActivityStats } from "@/hooks/use-badges";

export function StreakDisplay() {
  const { data, isLoading } = useActivityStats();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="h-20 animate-pulse rounded bg-border" />
      </div>
    );
  }

  const streak = data?.streak;
  if (!streak) return null;

  const progressPct = Math.round(streak.progress * 100);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            streak.current > 0 ? "bg-warning/20" : "bg-border/30"
          )}
        >
          <Flame
            className={cn(
              "h-7 w-7",
              streak.current > 0 ? "text-warning" : "text-text-secondary"
            )}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {streak.current}
            </span>
            <span className="text-sm text-text-secondary">day streak</span>
          </div>
          <p className="text-xs text-text-secondary">
            Longest: {streak.longest} days
          </p>
        </div>
      </div>

      {/* Next milestone progress */}
      {streak.progress < 1 && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-text-secondary">
            <span>Next milestone: {streak.next} days</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-warning transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
