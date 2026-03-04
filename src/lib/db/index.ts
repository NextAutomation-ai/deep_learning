import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "deeplearn.db");
const sqlite = new Database(dbPath);

// Allow waiting up to 5s when database is locked by another process
sqlite.pragma("busy_timeout = 5000");
// WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type Database = typeof db;

// Run migrations to create tables if they don't exist (safe to re-run)
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
try {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
} catch {
  // During build phase, migration folder may not be available
}

// All seed/init code wrapped in try-catch so it doesn't crash during
// Next.js build phase (tables may not exist yet during Docker build)
import { eq } from "drizzle-orm";
import { seedGuestContent, seedSampleContentForUser } from "./seed-sample-content";

try {
  // Seed default user if not exists (required for foreign key constraints)
  const defaultUser = db
    .select()
    .from(schema.users)
    .all()
    .find((u) => u.id === "default-user");

  if (!defaultUser) {
    db.insert(schema.users)
      .values({
        id: "default-user",
        name: "Learner",
        email: "learner@deeplearn.local",
      })
      .run();
  }

  // Reset guest user progress on every startup so guests always start fresh
  db.delete(schema.userStats).where(eq(schema.userStats.userId, "default-user")).run();
  db.delete(schema.userProgress).where(eq(schema.userProgress.userId, "default-user")).run();
  db.delete(schema.quizAttempts).where(eq(schema.quizAttempts.userId, "default-user")).run();

  // Seed sample content for guest and all existing users
  seedGuestContent();

  // Seed sample content for any existing signed-in users who don't have content yet
  const allUsers = db.select().from(schema.users).all();
  for (const u of allUsers) {
    if (u.id !== "default-user") {
      seedSampleContentForUser(u.id);
    }
  }
} catch (e) {
  // During build phase, tables may not exist — that's fine, seed at runtime
  console.warn("DB init skipped (likely build phase):", (e as Error).message);
}
