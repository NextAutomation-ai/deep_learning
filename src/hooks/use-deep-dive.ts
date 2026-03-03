"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

interface DeepDiveResponse {
  answer: string;
  model: string;
  cached: boolean;
}

interface WhatIfResponse {
  response: string;
  model: string;
  cached: boolean;
}

interface CompareResponse {
  similarities: string[];
  differences: string[];
  relationship: string;
  insight: string;
}

export function useDeepDiveAsk(contentId: string) {
  return useMutation({
    mutationFn: async (data: {
      question: string;
      conversationHistory: { role: "user" | "ai"; content: string }[];
    }) => {
      const res = await fetch(`/api/content/${contentId}/deep-dive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<DeepDiveResponse>;
    },
  });
}

export function useWhatIfAsk(contentId: string) {
  return useMutation({
    mutationFn: async (data: {
      scenario: string;
      conversationHistory: { role: "user" | "ai"; content: string }[];
    }) => {
      const res = await fetch(`/api/content/${contentId}/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<WhatIfResponse>;
    },
  });
}

export function useCompareConcepts(contentId: string) {
  return useMutation({
    mutationFn: async (data: {
      conceptIdA: string;
      conceptIdB: string;
    }) => {
      const res = await fetch(`/api/content/${contentId}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<CompareResponse>;
    },
  });
}
