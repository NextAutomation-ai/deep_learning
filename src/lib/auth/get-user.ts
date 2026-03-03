// Smart auth: tries real NextAuth session first, falls back to default user.
// Server-only — do NOT import this file from client components.

import { auth } from "@/lib/auth";
import { DEFAULT_USER } from "./default-user";

export async function getUser() {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return { user: session.user as { id: string; name?: string | null; email?: string | null } };
    }
  } catch {
    // Auth not configured or failed — fall through to default
  }
  return { user: DEFAULT_USER };
}
