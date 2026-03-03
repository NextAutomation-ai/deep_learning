"use client";

import { useQuery } from "@tanstack/react-query";

export interface MindmapNode {
  id: string;
  name: string;
  definition: string;
  conceptType: string | null;
  difficultyLevel: number | null;
  bloomsLevel: string | null;
  importanceScore: number | null;
  chunkId: string | null;
  masteryLevel: number;
}

export interface MindmapLink {
  source: string;
  target: string;
  relationshipType: string | null;
  strength: number | null;
  description: string | null;
}

export function useMindmapData(contentId: string) {
  return useQuery({
    queryKey: ["mindmap", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/mindmap`);
      if (!res.ok) throw new Error("Failed to fetch mindmap data");
      return res.json() as Promise<{ nodes: MindmapNode[]; links: MindmapLink[] }>;
    },
    enabled: !!contentId,
  });
}
