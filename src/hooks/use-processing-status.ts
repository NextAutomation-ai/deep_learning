"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface ProcessingStatus {
  status: string;
  progress: number;
  message?: string;
}

const POLL_INTERVAL = 2000; // Poll every 2 seconds

export function useProcessingStatus(contentId: string | null) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!contentId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/process/${contentId}/status`);
        if (!res.ok) return;

        const data = (await res.json()) as ProcessingStatus;
        setStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          queryClient.invalidateQueries({ queryKey: ["contents"] });
          queryClient.invalidateQueries({ queryKey: ["content", contentId] });
          stopPolling();
        }
      } catch {
        // Network error — keep polling
      }
    };

    setIsConnected(true);
    poll(); // Immediate first poll
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => stopPolling();
  }, [contentId, queryClient, stopPolling]);

  return { status, isConnected };
}
