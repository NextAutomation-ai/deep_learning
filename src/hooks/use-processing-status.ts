"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface ProcessingStatus {
  status: string;
  progress: number;
  message?: string;
}

const POLL_INTERVAL = 3000;
const STALL_THRESHOLD = 20000; // If no progress for 20s, re-trigger processing
const MAX_RETRIES = 8; // Max auto-retries (covers ~8 stages of processing)

export function useProcessingStatus(contentId: string | null) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(-1);
  const lastProgressTimeRef = useRef<number>(Date.now());
  const retriesRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!contentId) return;

    const retriggerProcessing = async () => {
      if (retriesRef.current >= MAX_RETRIES) return;
      retriesRef.current++;
      try {
        await fetch(`/api/process/${contentId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // Ignore — will retry on next stall detection
      }
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/process/${contentId}/status`);
        if (!res.ok) return;

        const data = (await res.json()) as ProcessingStatus;
        setStatus(data);

        if (data.status === "completed") {
          queryClient.invalidateQueries({ queryKey: ["contents"] });
          queryClient.invalidateQueries({ queryKey: ["content", contentId] });
          stopPolling();
          return;
        }

        if (data.status === "failed") {
          // Auto-retry failed processing (pipeline is resumable)
          if (retriesRef.current < MAX_RETRIES) {
            setStatus({ status: "analyzing", progress: data.progress, message: "Resuming processing..." });
            await retriggerProcessing();
          } else {
            queryClient.invalidateQueries({ queryKey: ["contents"] });
            queryClient.invalidateQueries({ queryKey: ["content", contentId] });
            stopPolling();
          }
          return;
        }

        // Detect stall — progress hasn't changed for STALL_THRESHOLD ms
        const now = Date.now();
        if (data.progress !== lastProgressRef.current) {
          lastProgressRef.current = data.progress;
          lastProgressTimeRef.current = now;
        } else if (now - lastProgressTimeRef.current > STALL_THRESHOLD) {
          // Progress stalled — function probably timed out, re-trigger
          lastProgressTimeRef.current = now;
          await retriggerProcessing();
        }
      } catch {
        // Network error — keep polling
      }
    };

    // Reset refs on new contentId
    lastProgressRef.current = -1;
    lastProgressTimeRef.current = Date.now();
    retriesRef.current = 0;

    setIsConnected(true);
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => stopPolling();
  }, [contentId, queryClient, stopPolling]);

  return { status, isConnected };
}
