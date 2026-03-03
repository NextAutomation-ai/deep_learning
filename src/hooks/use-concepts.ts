"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

export function useConceptsByContent(contentId: string) {
  return useQuery({
    queryKey: ["concepts", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/concepts`);
      if (!res.ok) throw new Error("Failed to fetch concepts");
      return res.json();
    },
    enabled: !!contentId,
  });
}

export function useConcept(conceptId: string) {
  return useQuery({
    queryKey: ["concept", conceptId],
    queryFn: async () => {
      const res = await fetch(`/api/concepts/${conceptId}`);
      if (!res.ok) throw new Error("Failed to fetch concept");
      return res.json();
    },
    enabled: !!conceptId,
  });
}

export function useExplainConcept() {
  return useMutation({
    mutationFn: async ({
      conceptId,
      mode,
    }: {
      conceptId: string;
      mode: "simpler" | "deeper" | "analogy" | "example";
    }) => {
      const res = await fetch(`/api/concepts/${conceptId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error("Failed to get explanation");
      return res.json();
    },
  });
}
