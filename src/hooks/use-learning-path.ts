"use client";

import { useQuery } from "@tanstack/react-query";

export function useLearningPath(contentId: string) {
  return useQuery({
    queryKey: ["learningPath", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/learning-path`);
      if (!res.ok) throw new Error("Failed to fetch learning path");
      return res.json();
    },
    enabled: !!contentId,
  });
}
