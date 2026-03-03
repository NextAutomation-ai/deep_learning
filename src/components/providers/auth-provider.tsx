"use client";

import { ToastContainer } from "@/components/ui/toast-container";

// Auth hidden — SessionProvider disabled. To re-enable, import SessionProvider from "next-auth/react".
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ToastContainer>{children}</ToastContainer>;
}
