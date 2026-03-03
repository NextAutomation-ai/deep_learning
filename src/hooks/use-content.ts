"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ContentFilters {
  q?: string;
  type?: string;
  status?: string;
  sort?: string;
  favorites?: boolean;
}

export function useContents(params?: ContentFilters) {
  return useQuery({
    queryKey: ["contents", params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.q) sp.set("q", params.q);
      if (params?.type && params.type !== "all") sp.set("type", params.type);
      if (params?.status && params.status !== "all")
        sp.set("status", params.status);
      if (params?.sort) sp.set("sort", params.sort);
      if (params?.favorites) sp.set("favorites", "1");
      const qs = sp.toString();
      const res = await fetch(`/api/content${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch contents");
      return res.json() as Promise<{
        contents: ContentItem[];
        totalCount: number;
      }>;
    },
  });
}

export function useContent(contentId: string) {
  return useQuery({
    queryKey: ["content", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}`);
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
    enabled: !!contentId,
  });
}

export function useUploadContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        let message = "Upload failed";
        try {
          const err = await res.json();
          message = err.error || message;
        } catch {
          message = `Server error (${res.status})`;
        }
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
    },
  });
}

export function useProcessContent() {
  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/process/${contentId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to start processing");
      return res.json();
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/content/${contentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
    },
  });
}

export function useFavoriteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`/api/content/${contentId}/favorite`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json() as Promise<{ isFavorited: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
    },
  });
}

export interface ContentItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  sourceType: string;
  sourceUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  processingStatus: string;
  processingProgress: number | null;
  processingError: string | null;
  totalChunks: number | null;
  totalConcepts: number | null;
  isFavorited: number | null;
  createdAt: number;
  updatedAt: number;
}
