"use client";

import { useQuery } from "@tanstack/react-query";

export function useUserStats() {
  return useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const res = await fetch("/api/user/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

export function useContentProgress(contentId: string) {
  return useQuery({
    queryKey: ["progress", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/progress`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    enabled: !!contentId,
  });
}
