import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
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
