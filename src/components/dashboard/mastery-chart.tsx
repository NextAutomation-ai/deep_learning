"use client";

import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MasteryData {
  mastery: {
    notStarted: number;
    learning: number;
    practicing: number;
    mastered: number;
  };
}

const SEGMENTS = [
  { key: "mastered", label: "Mastered", color: "var(--color-success)" },
  { key: "practicing", label: "Practicing", color: "var(--color-primary)" },
  { key: "learning", label: "Learning", color: "var(--color-warning)" },
  { key: "notStarted", label: "Not Started", color: "var(--color-border)" },
] as const;

export function MasteryChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["user", "mastery"],
    queryFn: async () => {
      const res = await fetch("/api/user/mastery");
      if (!res.ok) throw new Error("Failed to fetch mastery");
      return res.json() as Promise<MasteryData>;
    },
  });

  if (isLoading || !data) return null;

  const { mastery } = data;
  const total =
    mastery.notStarted + mastery.learning + mastery.practicing + mastery.mastered;

  if (total === 0) return null;

  const chartData = SEGMENTS.map((s) => ({
    name: s.label,
    value: mastery[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wide">
        Concept Mastery
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => {
                const v = Number(value) || 0;
                return [`${v} concepts (${Math.round((v / total) * 100)}%)`];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center text-sm text-text-secondary">
        {total} total concepts
      </div>
    </div>
  );
}
