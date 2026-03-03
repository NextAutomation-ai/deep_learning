"use client";

import { useState, useCallback } from "react";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "badge" | "success" | "error";
  duration?: number;
}

let toastId = 0;

const listeners: Set<(toast: ToastData) => void> = new Set();

export function toast(title: string, description?: string) {
  const t: ToastData = {
    id: String(++toastId),
    title,
    description,
    variant: "default",
  };
  listeners.forEach((fn) => fn(t));
}

export function toastSuccess(title: string, description?: string) {
  const t: ToastData = {
    id: String(++toastId),
    title,
    description,
    variant: "success",
  };
  listeners.forEach((fn) => fn(t));
}

export function toastError(title: string, description?: string) {
  const t: ToastData = {
    id: String(++toastId),
    title,
    description,
    variant: "error",
  };
  listeners.forEach((fn) => fn(t));
}

export function toastBadge(badgeName: string) {
  const t: ToastData = {
    id: String(++toastId),
    title: "Badge Unlocked!",
    description: badgeName,
    variant: "badge",
    duration: 5000,
  };
  listeners.forEach((fn) => fn(t));
}

export function useToastListener() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((t: ToastData) => {
    setToasts((prev) => [...prev, t]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const subscribe = useCallback(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  return { toasts, dismissToast, subscribe };
}
