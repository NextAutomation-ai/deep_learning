import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge-compatible base config (no DB adapter — used by middleware)
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public paths — always allowed
      const publicPaths = ["/login", "/api/auth"];
      if (publicPaths.some((path) => pathname.startsWith(path))) {
        return true;
      }

      // Write API routes — require auth (guests can't upload/process)
      const protectedApis = ["/api/content/upload", "/api/process"];
      if (protectedApis.some((path) => pathname.startsWith(path)) && !isLoggedIn) {
        return Response.json({ error: "Sign in required to upload content" }, { status: 401 });
      }

      // All other routes (pages + read APIs) — allow guests through
      return true;
    },
  },
};
