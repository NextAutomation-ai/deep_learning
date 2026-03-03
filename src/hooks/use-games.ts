"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ClashStartResponse {
  gameType: string;
  questions: Array<{
    id: string;
    conceptName: string;
    definition: string;
    options: string[];
    correctIndex: number;
  }>;
  totalQuestions: number;
  timePerQuestion: number;
}

interface ConnectionStartResponse {
  gameType: string;
  pairs: Array<{
    id: string;
    conceptName: string;
    relatedName: string;
    relationshipType: string;
  }>;
  leftColumn: Array<{ id: string; name: string }>;
  rightColumn: Array<{ id: string; name: string }>;
  totalPairs: number;
  timeLimitSeconds: number;
}

interface TowerStartResponse {
  gameType: string;
  blocks: Array<{
    id: string;
    conceptName: string;
    definition: string;
    difficulty: number;
    question: string;
    answer: string;
    options: string[];
    correctIndex: number;
  }>;
  totalLevels: number;
  livesTotal: number;
}

interface GameSubmitResponse {
  gameType: string;
  xpEarned: number;
  streakBonus: number;
  totalXp: number;
  newBadges: string[];
  correct?: number;
  total?: number;
  won?: boolean;
  levelsCompleted?: number;
}

export function useStartConceptClash(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/content/${contentId}/games/concept-clash/start`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<ClashStartResponse>;
    },
  });
}

export function useSubmitConceptClash(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { score: number; maxScore: number; correct: number; total: number }) => {
      const res = await fetch(`/api/content/${contentId}/games/concept-clash/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GameSubmitResponse>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userStats"] });
      qc.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}

export function useStartConnectionGame(contentId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/content/${contentId}/games/connection/start`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<ConnectionStartResponse>;
    },
  });
}

export function useSubmitConnectionGame(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { correct: number; total: number; timeTaken: number }) => {
      const res = await fetch(`/api/content/${contentId}/games/connection/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GameSubmitResponse>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userStats"] });
      qc.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}

export function useStartConceptTower(contentId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/content/${contentId}/games/concept-tower/start`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<TowerStartResponse>;
    },
  });
}

export function useSubmitConceptTower(contentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { levelsCompleted: number; totalLevels: number; livesRemaining: number }) => {
      const res = await fetch(`/api/content/${contentId}/games/concept-tower/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GameSubmitResponse>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userStats"] });
      qc.invalidateQueries({ queryKey: ["badges"] });
    },
  });
}
