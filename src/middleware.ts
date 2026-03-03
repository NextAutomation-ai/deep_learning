import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth middleware disabled — passthrough for all routes.
// To re-enable auth, replace with:
// import NextAuth from "next-auth";
// import { authConfig } from "@/lib/auth/config";
// export default NextAuth(authConfig).auth;

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
