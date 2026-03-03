"use client";

import { cn } from "@/lib/utils/cn";
import { useActivityStats } from "@/hooks/use-badges";

export function WeeklyHeatmap() {
  const { data, isLoading } = useActivityStats();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="h-32 animate-pulse rounded bg-border" />
      </div>
    );
  }

  const heatmap = data?.heatmap || [];

  // Build 90-day grid
  const today = new Date();
  const days: Array<{ date: string; count: number; xp: number }> = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = heatmap.find((h) => h.date === dateStr);
    days.push({
      date: dateStr,
      count: entry?.count || 0,
      xp: entry?.xp || 0,
    });
  }

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-border/50";
    if (count <= 2) return "bg-success/30";
    if (count <= 5) return "bg-success/50";
    if (count <= 10) return "bg-success/70";
    return "bg-success";
  };

  // Arrange into weeks (columns of 7)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Activity (Last 90 Days)
      </h3>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "h-3 w-3 rounded-sm transition-colors",
                  getIntensity(day.count)
                )}
                title={`${day.date}: ${day.count} sessions, ${day.xp} XP`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-border/50" />
          <div className="h-3 w-3 rounded-sm bg-success/30" />
          <div className="h-3 w-3 rounded-sm bg-success/50" />
          <div className="h-3 w-3 rounded-sm bg-success/70" />
          <div className="h-3 w-3 rounded-sm bg-success" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
