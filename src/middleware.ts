import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Protect all routes except static files, images, and auth endpoints
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
