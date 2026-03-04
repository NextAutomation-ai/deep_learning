// Server-only — do NOT import this file from client components.

import { auth } from "@/lib/auth";
import { DEFAULT_USER } from "./default-user";

export async function getUser() {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        user: session.user as { id: string; name?: string | null; email?: string | null; image?: string | null },
        isGuest: false,
      };
    }
  } catch {
    // Auth not configured or failed — fall through to guest
  }
  return { user: DEFAULT_USER, isGuest: true };
}

/**
 * Strict auth check — throws if not logged in. Use for protected actions (upload, process).
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return { user: session.user as { id: string; name?: string | null; email?: string | null; image?: string | null } };
}
