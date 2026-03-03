"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useStartQuiz() {
  return useMutation({
    mutationFn: async ({
      contentId,
      mode,
      chunkId,
    }: {
      contentId: string;
      mode: string;
      chunkId?: string;
    }) => {
      const res = await fetch(`/api/content/${contentId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, chunkId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start quiz");
      }
      return res.json();
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      quizId,
      answers,
      mode,
    }: {
      contentId: string;
      quizId: string;
      answers: Array<{ questionId: string; userAnswer: string; timeTaken?: number }>;
      mode: string;
    }) => {
      const res = await fetch(`/api/content/${contentId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers, mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit quiz");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progress", variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["concepts", variables.contentId] });
    },
  });
}
