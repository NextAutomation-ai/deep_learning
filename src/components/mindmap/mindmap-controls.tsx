"use client";

import { useMindmapStore, type ColorMode } from "@/stores/mindmap-store";
import { Search, Eye, EyeOff, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const colorModes: { value: ColorMode; label: string }[] = [
  { value: "mastery", label: "Mastery" },
  { value: "difficulty", label: "Difficulty" },
  { value: "blooms", label: "Bloom's" },
];

export function MindmapControls() {
  const { colorMode, setColorMode, searchQuery, setSearchQuery, showLabels, toggleLabels, showLegend, toggleLegend } =
    useMindmapStore();

  return (
    <div className="absolute left-2 right-2 top-2 z-10 flex flex-wrap items-center gap-2 sm:left-4 sm:right-auto sm:top-4 sm:gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-32 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-48 sm:placeholder:content-['Search_concepts...']"
        />
      </div>

      {/* Color mode */}
      <div className="flex rounded-lg border border-border bg-surface">
        {colorModes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setColorMode(mode.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              colorMode === mode.value
                ? "bg-primary text-white"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Labels toggle */}
      <button
        onClick={toggleLabels}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary"
        title={showLabels ? "Hide labels" : "Show labels"}
      >
        {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>

      {/* Legend toggle */}
      <button
        onClick={toggleLegend}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary",
          showLegend && "border-primary bg-primary/10 text-primary"
        )}
        title={showLegend ? "Hide legend" : "Show legend"}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
