"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface ProcessingStatus {
  status: string;
  progress: number;
  message?: string;
}

export function useProcessingStatus(contentId: string | null) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!contentId) return;

    const eventSource = new EventSource(
      `/api/process/${contentId}/status`
    );

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProcessingStatus;
        setStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          queryClient.invalidateQueries({ queryKey: ["contents"] });
          queryClient.invalidateQueries({ queryKey: ["content", contentId] });
          eventSource.close();
          setIsConnected(false);
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [contentId, queryClient]);

  return { status, isConnected };
}
