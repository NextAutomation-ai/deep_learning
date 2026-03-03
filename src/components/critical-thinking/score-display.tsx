"use client";

import { cn } from "@/lib/utils/cn";
import { Sparkles } from "lucide-react";

interface ScoreItem {
  label: string;
  score: number;
}

export function ScoreDisplay({
  scores,
  feedback,
  xpEarned,
  onDone,
}: {
  scores: ScoreItem[];
  feedback: string;
  xpEarned: number;
  onDone: () => void;
}) {
  const overallScore =
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* XP Banner */}
      <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold text-primary">+{xpEarned} XP</span>
      </div>

      {/* Overall Score */}
      <div className="text-center">
        <div
          className={cn(
            "inline-flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold",
            overallScore >= 0.7
              ? "bg-success/10 text-success"
              : overallScore >= 0.4
                ? "bg-warning/10 text-warning"
                : "bg-danger/10 text-danger"
          )}
        >
          {Math.round(overallScore * 100)}%
        </div>
      </div>

      {/* Score Bars */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        {scores.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-text-secondary">{item.label}</span>
              <span className="font-medium text-text-primary">
                {Math.round(item.score * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-border">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  item.score >= 0.7
                    ? "bg-success"
                    : item.score >= 0.4
                      ? "bg-warning"
                      : "bg-danger"
                )}
                style={{ width: `${item.score * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-1 text-xs font-medium text-primary">AI Feedback</p>
        <p className="text-sm text-text-secondary">{feedback}</p>
      </div>

      <button
        onClick={onDone}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
      >
        Done
      </button>
    </div>
  );
}
