"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useFlashcards(contentId: string) {
  return useQuery({
    queryKey: ["flashcards", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/flashcards`);
      if (!res.ok) throw new Error("Failed to fetch flashcards");
      return res.json();
    },
    enabled: !!contentId,
  });
}

export function useReviewFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      flashcardId,
      contentId,
      conceptId,
      rating,
    }: {
      flashcardId: string;
      contentId: string;
      conceptId: string;
      rating: 1 | 3 | 4 | 5;
    }) => {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId, contentId, conceptId, rating }),
      });
      if (!res.ok) throw new Error("Failed to review flashcard");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ["progress", variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}
