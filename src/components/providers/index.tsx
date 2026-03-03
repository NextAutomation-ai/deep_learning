"use client";

import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ThemeInitializer } from "./theme-initializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeInitializer />
        {children}
      </QueryProvider>
    </AuthProvider>
  );
}
