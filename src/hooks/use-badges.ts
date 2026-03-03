"use client";

import { useQuery } from "@tanstack/react-query";

interface BadgeWithStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  earned: boolean;
  earnedAt: Date | null;
}

interface BadgesResponse {
  badges: BadgeWithStatus[];
  totalEarned: number;
  totalAvailable: number;
}

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const res = await fetch("/api/badges");
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json() as Promise<BadgesResponse>;
    },
  });
}

export function useActivityStats() {
  return useQuery({
    queryKey: ["activityStats"],
    queryFn: async () => {
      const res = await fetch("/api/stats/activity");
      if (!res.ok) throw new Error("Failed to fetch activity stats");
      return res.json() as Promise<{
        heatmap: Array<{ date: string; count: number; xp: number }>;
        weeklyXp: Record<string, number>;
        sessionTypes: Record<string, number>;
        streak: {
          current: number;
          longest: number;
          next: number;
          progress: number;
        };
        totalSessions: number;
      }>;
    },
  });
}
