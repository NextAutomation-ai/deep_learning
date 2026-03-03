"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================
// SOCRATIC
// ============================================

export function useStartSocratic() {
  return useMutation({
    mutationFn: async ({
      contentId,
      conceptId,
    }: {
      contentId: string;
      conceptId?: string;
    }) => {
      const res = await fetch(`/api/content/${contentId}/socratic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start Socratic session");
      }
      return res.json() as Promise<{
        sessionId: string;
        conceptId: string;
        conceptName: string;
        firstQuestion: string;
      }>;
    },
  });
}

export function useSocraticRespond() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      sessionId,
      message,
      action,
    }: {
      contentId: string;
      sessionId: string;
      message?: string;
      action?: "complete";
    }) => {
      const res = await fetch(
        `/api/content/${contentId}/socratic/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, action }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send response");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["progress", variables.contentId],
      });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}

export function useSocraticSession(contentId: string, sessionId: string | null) {
  return useQuery({
    queryKey: ["socratic", contentId, sessionId],
    queryFn: async () => {
      const res = await fetch(
        `/api/content/${contentId}/socratic/${sessionId}`
      );
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!sessionId,
  });
}

// ============================================
// ARGUMENTS
// ============================================

export function useArguments(contentId: string) {
  return useQuery({
    queryKey: ["arguments", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}/arguments`);
      if (!res.ok) throw new Error("Failed to fetch arguments");
      return res.json() as Promise<{
        arguments: Array<{
          id: string;
          contentId: string;
          thesis: string;
          premises: string[] | null;
          evidence: string[] | null;
          assumptions: string[] | null;
          conclusion: string | null;
          logicalStructure: string | null;
          fallacies: string[] | null;
          strengthScore: number | null;
          counterArguments: string[] | null;
        }>;
      }>;
    },
  });
}

export function useAddCounterArgument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      argumentId,
      counterArgument,
    }: {
      contentId: string;
      argumentId: string;
      counterArgument: string;
    }) => {
      const res = await fetch(
        `/api/content/${contentId}/arguments/counter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ argumentId, counterArgument }),
        }
      );
      if (!res.ok) throw new Error("Failed to add counter-argument");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["arguments", variables.contentId],
      });
    },
  });
}

// ============================================
// DEVIL'S ADVOCATE
// ============================================

export function useStartDebate() {
  return useMutation({
    mutationFn: async ({
      contentId,
      claim,
      argumentId,
      steelManMode,
    }: {
      contentId: string;
      claim: string;
      argumentId?: string;
      steelManMode?: boolean;
    }) => {
      const res = await fetch(`/api/content/${contentId}/devils-advocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, argumentId, steelManMode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start debate");
      }
      return res.json() as Promise<{
        debateId: string;
        aiCounterArgument: string;
        steelManMode: boolean;
      }>;
    },
  });
}

export function useDebateRespond() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      debateId,
      message,
      action,
    }: {
      contentId: string;
      debateId: string;
      message?: string;
      action?: "complete";
    }) => {
      const res = await fetch(
        `/api/content/${contentId}/devils-advocate/${debateId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, action }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send response");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["progress", variables.contentId],
      });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}

// ============================================
// BIAS DETECTION
// ============================================

export function useStartBiasExercise() {
  return useMutation({
    mutationFn: async ({
      contentId,
      chunkId,
    }: {
      contentId: string;
      chunkId?: string;
    }) => {
      const res = await fetch(`/api/content/${contentId}/bias-detection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunkId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start bias exercise");
      }
      return res.json() as Promise<{
        exerciseId: string;
        passage: string;
        questions: string[];
      }>;
    },
  });
}

export function useSubmitBiasExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      exerciseId,
      responses,
    }: {
      contentId: string;
      exerciseId: string;
      responses: Array<{ question: string; answer: string }>;
    }) => {
      const res = await fetch(`/api/content/${contentId}/bias-detection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, responses }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit responses");
      }
      return res.json() as Promise<{
        scores: {
          perspective: number;
          factOpinion: number;
          biasIdentification: number;
          overall: number;
        };
        feedback: string;
        xpEarned: number;
      }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["progress", variables.contentId],
      });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}

// ============================================
// TEACH-BACK
// ============================================

export function useSubmitTeachBack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentId,
      conceptId,
      userExplanation,
    }: {
      contentId: string;
      conceptId: string;
      userExplanation: string;
    }) => {
      const res = await fetch(`/api/content/${contentId}/teach-back`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId, userExplanation }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit teach-back");
      }
      return res.json() as Promise<{
        scores: {
          accuracy: number;
          completeness: number;
          reasoning: number;
          criticalThinking: number;
          overall: number;
        };
        feedback: string;
        xpEarned: number;
      }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["progress", variables.contentId],
      });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
}
