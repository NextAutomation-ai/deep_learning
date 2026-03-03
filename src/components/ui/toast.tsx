"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils/cn";
import { X, Trophy } from "lucide-react";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      <ToastViewport />
    </ToastPrimitive.Provider>
  );
}

function ToastViewport() {
  return (
    <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]" />
  );
}

export interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: "default" | "badge" | "success" | "error";
  duration?: number;
}

export function Toast({
  open,
  onOpenChange,
  title,
  description,
  variant = "default",
  duration = 4000,
}: ToastProps) {
  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-4 shadow-lg transition-all",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-full",
        variant === "default" && "border-border bg-surface text-text-primary",
        variant === "badge" &&
          "border-warning/30 bg-gradient-to-r from-warning/10 to-warning/5 text-text-primary",
        variant === "success" && "border-success/30 bg-success/10 text-text-primary",
        variant === "error" && "border-danger/30 bg-danger/10 text-text-primary"
      )}
    >
      {variant === "badge" && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20">
          <Trophy className="h-5 w-5 text-warning" />
        </div>
      )}
      <div className="flex-1">
        <ToastPrimitive.Title className="text-sm font-semibold">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="mt-0.5 text-xs text-text-secondary">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="rounded-md p-1 text-text-secondary opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}
