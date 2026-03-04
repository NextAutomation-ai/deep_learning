"use client";

import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "@/components/ui/toast-container";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastContainer>{children}</ToastContainer>
    </SessionProvider>
  );
}
