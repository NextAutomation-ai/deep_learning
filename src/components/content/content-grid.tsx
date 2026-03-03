"use client";

import { useContents, type ContentFilters } from "@/hooks/use-content";
import { ContentCard } from "./content-card";
import { Library, Loader2, Search } from "lucide-react";

export function ContentGrid({ filters }: { filters?: ContentFilters }) {
  const { data, isLoading, error } = useContents(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
        <p className="text-sm text-danger">
          Failed to load content. Please try again.
        </p>
      </div>
    );
  }

  const contents = data?.contents || [];
  const hasFilters =
    filters?.q ||
    (filters?.type && filters.type !== "all") ||
    (filters?.status && filters.status !== "all") ||
    filters?.favorites;

  if (contents.length === 0) {
    if (hasFilters) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary">
            No content matches your filters
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-secondary">
            Try adjusting your search or filters to find what you&apos;re
            looking for.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Library className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-text-primary">
          No content yet
        </h3>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">
          Upload a PDF, paste a URL, or enter some text to start learning.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contents.map((content) => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  );
}
