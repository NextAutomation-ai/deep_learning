"use client";

import { useEffect } from "react";
import { ToastProvider, Toast } from "./toast";
import { useToastListener } from "@/hooks/use-toast";

export function ToastContainer({ children }: { children: React.ReactNode }) {
  const { toasts, dismissToast, subscribe } = useToastListener();

  useEffect(() => {
    return subscribe();
  }, [subscribe]);

  return (
    <ToastProvider>
      {children}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) dismissToast(t.id);
          }}
          title={t.title}
          description={t.description}
          variant={t.variant}
          duration={t.duration}
        />
      ))}
    </ToastProvider>
  );
}
