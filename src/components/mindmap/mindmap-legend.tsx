"use client";

import { useMindmapStore, type ColorMode } from "@/stores/mindmap-store";

export const RELATIONSHIP_STYLES: Record<
  string,
  { color: string; label: string; dashArray: string }
> = {
  prerequisite: { color: "#3b82f6", label: "Prerequisite", dashArray: "none" },
  supports: { color: "#22c55e", label: "Supports", dashArray: "none" },
  contradicts: { color: "#ef4444", label: "Contradicts", dashArray: "6 3" },
  causes: { color: "#f97316", label: "Causes", dashArray: "none" },
  part_of: { color: "#8b5cf6", label: "Part of", dashArray: "2 3" },
  example_of: { color: "#06b6d4", label: "Example of", dashArray: "2 3" },
  opposite: { color: "#ec4899", label: "Opposite", dashArray: "6 3" },
  related: { color: "#94a3b8", label: "Related", dashArray: "none" },
};

export const DIRECTIONAL_TYPES = new Set([
  "prerequisite",
  "causes",
  "example_of",
  "part_of",
]);

const NODE_LEGENDS: Record<
  ColorMode,
  { label: string; items: { color: string; label: string }[] }
> = {
  mastery: {
    label: "Mastery Level",
    items: [
      { color: "#22c55e", label: "High (≥75%)" },
      { color: "#eab308", label: "Medium (50-74%)" },
      { color: "#f97316", label: "Low (1-49%)" },
      { color: "#94a3b8", label: "Not started" },
    ],
  },
  difficulty: {
    label: "Difficulty",
    items: [
      { color: "#93c5fd", label: "Level 1" },
      { color: "#60a5fa", label: "Level 2" },
      { color: "#3b82f6", label: "Level 3" },
      { color: "#2563eb", label: "Level 4" },
      { color: "#1d4ed8", label: "Level 5" },
    ],
  },
  blooms: {
    label: "Bloom's Level",
    items: [
      { color: "#3b82f6", label: "Remember" },
      { color: "#06b6d4", label: "Understand" },
      { color: "#10b981", label: "Apply" },
      { color: "#f59e0b", label: "Analyze" },
      { color: "#ef4444", label: "Evaluate" },
      { color: "#8b5cf6", label: "Create" },
    ],
  },
};

export function MindmapLegend() {
  const { colorMode, showLegend } = useMindmapStore();

  if (!showLegend) return null;

  const nodeLegend = NODE_LEGENDS[colorMode];

  return (
    <div className="absolute bottom-4 left-4 z-10 w-52 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-sm">
      {/* Node Colors */}
      <div className="mb-2.5">
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
          {nodeLegend.label}
        </h4>
        <div className="space-y-1">
          {nodeLegend.items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] text-text-secondary">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <hr className="my-2 border-border" />

      {/* Link Styles */}
      <div>
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
          Relationships
        </h4>
        <div className="space-y-1">
          {Object.entries(RELATIONSHIP_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2">
              <svg width="18" height="8" className="flex-shrink-0">
                <line
                  x1="0"
                  y1="4"
                  x2="18"
                  y2="4"
                  stroke={style.color}
                  strokeWidth="2"
                  strokeDasharray={style.dashArray}
                />
                {DIRECTIONAL_TYPES.has(key) && (
                  <polygon
                    points="13,1 18,4 13,7"
                    fill={style.color}
                  />
                )}
              </svg>
              <span className="text-[11px] text-text-secondary">
                {style.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
