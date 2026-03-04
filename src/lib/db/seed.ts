import { db } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { seedGuestContent, seedSampleContentForUser } from "./seed-sample-content";

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  seeded = true;

  try {
    // Seed default user if not exists
    const [defaultUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, "default-user"))
      .limit(1);

    if (!defaultUser) {
      await db.insert(schema.users).values({
        id: "default-user",
        name: "Learner",
        email: "learner@deeplearn.local",
      });
    }

    // Reset guest user progress on every startup so guests always start fresh
    await db.delete(schema.userStats).where(eq(schema.userStats.userId, "default-user"));
    await db.delete(schema.userProgress).where(eq(schema.userProgress.userId, "default-user"));
    await db.delete(schema.quizAttempts).where(eq(schema.quizAttempts.userId, "default-user"));

    // Seed sample content for guest and all existing users
    await seedGuestContent();

    // Seed sample content for any existing signed-in users who don't have content yet
    const allUsers = await db.select().from(schema.users);
    for (const u of allUsers) {
      if (u.id !== "default-user") {
        await seedSampleContentForUser(u.id);
      }
    }
  } catch (e) {
    console.warn("DB seed skipped:", (e as Error).message);
  }
}
