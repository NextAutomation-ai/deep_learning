"use client";

import { useQuery } from "@tanstack/react-query";

interface SearchResults {
  contents: Array<{
    id: string;
    title: string;
    sourceType: string;
    processingStatus: string;
  }>;
  concepts: Array<{
    id: string;
    contentId: string;
    name: string;
    definition: string;
  }>;
  flashcards: Array<{
    id: string;
    contentId: string;
    frontText: string;
  }>;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<SearchResults>;
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
