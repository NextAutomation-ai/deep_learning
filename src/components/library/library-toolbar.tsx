"use client";

import { Search, Star, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LibraryFilters {
  q: string;
  type: string;
  status: string;
  sort: string;
  favorites: boolean;
}

interface LibraryToolbarProps {
  filters: LibraryFilters;
  onFiltersChange: (filters: LibraryFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export function LibraryToolbar({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: LibraryToolbarProps) {
  const update = (partial: Partial<LibraryFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  const hasActiveFilters =
    filters.q ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.sort !== "newest" ||
    filters.favorites;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Filter by title..."
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Source type */}
        <select
          value={filters.type}
          onChange={(e) => update({ type: e.target.value })}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="url">URL</option>
          <option value="text">Text</option>
          <option value="txt">TXT</option>
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="az">A - Z</option>
          <option value="za">Z - A</option>
          <option value="concepts">Most Concepts</option>
        </select>

        {/* Favorites toggle */}
        <button
          onClick={() => update({ favorites: !filters.favorites })}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
            filters.favorites
              ? "border-warning bg-warning/10 text-warning"
              : "border-border text-text-secondary hover:bg-surface-hover"
          )}
        >
          <Star
            className={cn("h-4 w-4", filters.favorites && "fill-warning")}
          />
          <span className="hidden sm:inline">Favorites</span>
        </button>
      </div>

      {/* Result count + clear */}
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>
          {filteredCount === totalCount
            ? `${totalCount} items`
            : `${filteredCount} of ${totalCount} items`}
        </span>
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({
                q: "",
                type: "all",
                status: "all",
                sort: "newest",
                favorites: false,
              })
            }
            className="text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
