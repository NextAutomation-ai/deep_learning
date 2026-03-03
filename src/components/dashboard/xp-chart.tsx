"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useActivityStats } from "@/hooks/use-badges";

export function XpChart() {
  const { data, isLoading } = useActivityStats();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="h-48 animate-pulse rounded bg-border" />
      </div>
    );
  }

  const weeklyXp = data?.weeklyXp || {};

  // Build last 8 weeks of data
  const chartData: Array<{ week: string; xp: number }> = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekKey = getWeekKey(d);
    const label = `W${8 - i}`;
    chartData.push({
      week: label,
      xp: weeklyXp[weekKey] || 0,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Weekly XP
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="xp"
            fill="var(--color-primary)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}
