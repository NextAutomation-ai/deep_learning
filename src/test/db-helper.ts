import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    email_verified INTEGER,
    image TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL,
    source_url TEXT,
    file_name TEXT,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    raw_text TEXT,
    content_hash TEXT,
    total_chunks INTEGER DEFAULT 0,
    total_concepts INTEGER DEFAULT 0,
    processing_status TEXT NOT NULL DEFAULT 'pending',
    processing_error TEXT,
    processing_progress INTEGER DEFAULT 0,
    metadata TEXT,
    is_favorited INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS content_chunks (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chapter_title TEXT,
    section_title TEXT,
    text TEXT NOT NULL,
    token_count INTEGER,
    metadata TEXT
  );

  CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    chunk_id TEXT REFERENCES content_chunks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    definition TEXT NOT NULL,
    detailed_explanation TEXT,
    source_excerpt TEXT,
    concept_type TEXT,
    difficulty_level INTEGER DEFAULT 1,
    blooms_level TEXT,
    prerequisites TEXT,
    tags TEXT,
    importance_score REAL DEFAULT 0.5,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    concept_id TEXT REFERENCES concepts(id),
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    content_id TEXT NOT NULL REFERENCES contents(id),
    concept_id TEXT NOT NULL REFERENCES concepts(id),
    mastery_level REAL DEFAULT 0,
    blooms_achieved TEXT DEFAULT 'remember',
    times_reviewed INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    last_reviewed_at INTEGER,
    next_review_at INTEGER,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE UNIQUE INDEX IF NOT EXISTS user_progress_unique_idx
    ON user_progress(user_id, content_id, concept_id);

  CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date TEXT,
    total_concepts_mastered INTEGER DEFAULT 0,
    total_quizzes_completed INTEGER DEFAULT 0,
    total_time_spent_minutes INTEGER DEFAULT 0,
    badges TEXT,
    achievements TEXT,
    weekly_xp TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );
`;

export function createTestDb() {
  const rawDb = new Database(":memory:");
  rawDb.pragma("foreign_keys = ON");
  rawDb.exec(CREATE_TABLES_SQL);

  const db = drizzle(rawDb, { schema });
  return { db, rawDb };
}

export function seedDefaultUser(db: ReturnType<typeof createTestDb>["db"]) {
  const now = Date.now();
  db.insert(schema.users).values({
    id: "default-user",
    name: "Learner",
    email: "learner@deeplearn.local",
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }).run();
}

export function seedContent(
  db: ReturnType<typeof createTestDb>["db"],
  overrides: Partial<typeof schema.contents.$inferInsert> & { id: string; title: string }
) {
  const now = Date.now();
  db.insert(schema.contents).values({
    userId: "default-user",
    sourceType: "pdf",
    processingStatus: "completed",
    createdAt: new Date(now),
    updatedAt: new Date(now),
    ...overrides,
  }).run();
}

export function seedConcept(
  db: ReturnType<typeof createTestDb>["db"],
  overrides: Partial<typeof schema.concepts.$inferInsert> & { id: string; contentId: string; name: string; definition: string }
) {
  db.insert(schema.concepts).values({
    createdAt: new Date(),
    ...overrides,
  }).run();
}

export function seedFlashcard(
  db: ReturnType<typeof createTestDb>["db"],
  overrides: Partial<typeof schema.flashcards.$inferInsert> & { id: string; contentId: string; frontText: string; backText: string }
) {
  db.insert(schema.flashcards).values({
    createdAt: new Date(),
    ...overrides,
  }).run();
}

export function seedUserProgress(
  db: ReturnType<typeof createTestDb>["db"],
  overrides: Partial<typeof schema.userProgress.$inferInsert> & { id: string; userId: string; contentId: string; conceptId: string }
) {
  db.insert(schema.userProgress).values({
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }).run();
}
