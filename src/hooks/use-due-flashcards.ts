"use client";

import { useQuery } from "@tanstack/react-query";

interface DueCount {
  dueCount: number;
  totalCount: number;
}

interface DueCard {
  id: string;
  contentId: string;
  conceptId: string | null;
  frontText: string;
  backText: string;
  difficultyLevel: number | null;
  contentTitle: string;
  isDue: boolean;
  sm2State: {
    easeFactor: number | null;
    intervalDays: number | null;
    repetitions: number | null;
    masteryLevel: number | null;
  } | null;
}

export function useDueCount() {
  return useQuery({
    queryKey: ["flashcards", "due", "count"],
    queryFn: async () => {
      const res = await fetch("/api/flashcards/due");
      if (!res.ok) throw new Error("Failed to fetch due count");
      return res.json() as Promise<DueCount>;
    },
    refetchInterval: 60_000,
  });
}

export function useDueCards() {
  return useQuery({
    queryKey: ["flashcards", "due", "cards"],
    queryFn: async () => {
      const res = await fetch("/api/flashcards/due/cards");
      if (!res.ok) throw new Error("Failed to fetch due cards");
      return res.json() as Promise<{ flashcards: DueCard[] }>;
    },
  });
}
