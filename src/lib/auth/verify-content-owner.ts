import { db } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Verifies the content belongs to the given user.
 * Returns the content row if owned, null otherwise.
 */
export async function verifyContentOwnership(contentId: string, userId: string) {
  const [row] = await db
    .select()
    .from(contents)
    .where(and(eq(contents.id, contentId), eq(contents.userId, userId)))
    .limit(1);
  return row || null;
}
