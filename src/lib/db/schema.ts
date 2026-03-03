import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================
// AUTH TABLES (NextAuth Drizzle Adapter)
// ============================================

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    compositePk: primaryKey({ columns: [t.identifier, t.token] }),
  })
);

// ============================================
// CONTENT TABLES
// ============================================

export const contents = sqliteTable(
  "contents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    sourceType: text("source_type", {
      enum: ["pdf", "docx", "url", "text", "youtube", "epub", "txt"],
    }).notNull(),
    sourceUrl: text("source_url"),
    fileName: text("file_name"),
    filePath: text("file_path"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    rawText: text("raw_text"),
    contentHash: text("content_hash"),
    totalChunks: integer("total_chunks").default(0),
    totalConcepts: integer("total_concepts").default(0),
    processingStatus: text("processing_status", {
      enum: [
        "pending",
        "extracting",
        "chunking",
        "analyzing",
        "generating",
        "completed",
        "failed",
      ],
    })
      .notNull()
      .default("pending"),
    processingError: text("processing_error"),
    processingProgress: integer("processing_progress").default(0),
    metadata: text("metadata", { mode: "json" }),
    isFavorited: integer("is_favorited").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    userIdx: index("contents_user_idx").on(table.userId),
    statusIdx: index("contents_status_idx").on(table.processingStatus),
  })
);

export const contentChunks = sqliteTable(
  "content_chunks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    chapterTitle: text("chapter_title"),
    sectionTitle: text("section_title"),
    text: text("text").notNull(),
    tokenCount: integer("token_count"),
    metadata: text("metadata", { mode: "json" }),
  },
  (table) => ({
    contentIdx: index("chunks_content_idx").on(table.contentId),
  })
);

// ============================================
// CONCEPT TABLES
// ============================================

export const concepts = sqliteTable(
  "concepts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    chunkId: text("chunk_id").references(() => contentChunks.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    definition: text("definition").notNull(),
    detailedExplanation: text("detailed_explanation"),
    sourceExcerpt: text("source_excerpt"),
    conceptType: text("concept_type", {
      enum: [
        "term",
        "theory",
        "argument",
        "fact",
        "process",
        "principle",
        "example",
        "person",
        "event",
        "formula",
      ],
    }),
    difficultyLevel: integer("difficulty_level").default(1),
    bloomsLevel: text("blooms_level", {
      enum: [
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ],
    }),
    prerequisites: text("prerequisites", { mode: "json" }).$type<string[]>(),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    importanceScore: real("importance_score").default(0.5),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    contentIdx: index("concepts_content_idx").on(table.contentId),
  })
);

export const conceptRelationships = sqliteTable(
  "concept_relationships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    sourceConceptId: text("source_concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    targetConceptId: text("target_concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    relationshipType: text("relationship_type", {
      enum: [
        "prerequisite",
        "related",
        "contradicts",
        "supports",
        "part_of",
        "causes",
        "example_of",
        "opposite",
      ],
    }),
    strength: real("strength").default(0.5),
    description: text("description"),
  },
  (table) => ({
    contentIdx: index("relationships_content_idx").on(table.contentId),
    sourceIdx: index("relationships_source_idx").on(table.sourceConceptId),
    targetIdx: index("relationships_target_idx").on(table.targetConceptId),
  })
);

// ============================================
// ARGUMENTS TABLE (Critical Thinking)
// ============================================

export const arguments_ = sqliteTable(
  "arguments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    chunkId: text("chunk_id").references(() => contentChunks.id),
    thesis: text("thesis").notNull(),
    premises: text("premises", { mode: "json" }).$type<string[]>(),
    evidence: text("evidence", { mode: "json" }).$type<string[]>(),
    assumptions: text("assumptions", { mode: "json" }).$type<string[]>(),
    conclusion: text("conclusion"),
    logicalStructure: text("logical_structure"),
    fallacies: text("fallacies", { mode: "json" }).$type<string[]>(),
    strengthScore: real("strength_score").default(0.5),
    counterArguments: text("counter_arguments", { mode: "json" }).$type<
      string[]
    >(),
  },
  (table) => ({
    contentIdx: index("arguments_content_idx").on(table.contentId),
  })
);

// ============================================
// QUIZ & FLASHCARD TABLES
// ============================================

export const questions = sqliteTable(
  "questions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id, {
      onDelete: "set null",
    }),
    chunkId: text("chunk_id").references(() => contentChunks.id),
    questionType: text("question_type", {
      enum: [
        "mcq",
        "true_false",
        "fill_blank",
        "short_answer",
        "explain",
        "sequence",
        "match",
        "scenario",
        "socratic",
        "devils_advocate",
        "bias_detection",
        "what_if",
        "compare_contrast",
      ],
    }).notNull(),
    questionText: text("question_text").notNull(),
    options: text("options", { mode: "json" }),
    correctAnswer: text("correct_answer"),
    explanation: text("explanation"),
    difficultyLevel: integer("difficulty_level").default(1),
    bloomsLevel: text("blooms_level", {
      enum: [
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ],
    }),
    points: integer("points").default(10),
    timeLimitSeconds: integer("time_limit_seconds").default(60),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    contentIdx: index("questions_content_idx").on(table.contentId),
    conceptIdx: index("questions_concept_idx").on(table.conceptId),
  })
);

export const flashcards = sqliteTable(
  "flashcards",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id),
    frontText: text("front_text").notNull(),
    backText: text("back_text").notNull(),
    difficultyLevel: integer("difficulty_level").default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    contentIdx: index("flashcards_content_idx").on(table.contentId),
  })
);

// ============================================
// USER PROGRESS & GAMIFICATION
// ============================================

export const userProgress = sqliteTable(
  "user_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id),
    masteryLevel: real("mastery_level").default(0),
    bloomsAchieved: text("blooms_achieved").default("remember"),
    timesReviewed: integer("times_reviewed").default(0),
    timesCorrect: integer("times_correct").default(0),
    timesIncorrect: integer("times_incorrect").default(0),
    lastReviewedAt: integer("last_reviewed_at", { mode: "timestamp_ms" }),
    nextReviewAt: integer("next_review_at", { mode: "timestamp_ms" }),
    easeFactor: real("ease_factor").default(2.5),
    intervalDays: integer("interval_days").default(1),
    streak: integer("streak").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    userContentConceptIdx: uniqueIndex("user_progress_unique_idx").on(
      table.userId,
      table.contentId,
      table.conceptId
    ),
  })
);

export const quizAttempts = sqliteTable(
  "quiz_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id),
    quizType: text("quiz_type").notNull(),
    questionsAttempted: integer("questions_attempted").default(0),
    questionsCorrect: integer("questions_correct").default(0),
    score: integer("score").default(0),
    maxScore: integer("max_score").default(0),
    timeTakenSeconds: integer("time_taken_seconds"),
    difficultyLevel: integer("difficulty_level").default(1),
    answers: text("answers", { mode: "json" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    userIdx: index("quiz_attempts_user_idx").on(table.userId),
    contentIdx: index("quiz_attempts_content_idx").on(table.contentId),
  })
);

export const userStats = sqliteTable("user_stats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  totalXp: integer("total_xp").default(0),
  level: integer("level").default(1),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: text("last_activity_date"),
  totalConceptsMastered: integer("total_concepts_mastered").default(0),
  totalQuizzesCompleted: integer("total_quizzes_completed").default(0),
  totalTimeSpentMinutes: integer("total_time_spent_minutes").default(0),
  badges: text("badges", { mode: "json" }).$type<string[]>(),
  achievements: text("achievements", { mode: "json" }).$type<string[]>(),
  weeklyXp: text("weekly_xp", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(
    () => new Date()
  ),
});

// ============================================
// LEARNING SESSIONS
// ============================================

export const learningSessions = sqliteTable(
  "learning_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id),
    sessionType: text("session_type", {
      enum: [
        "reading",
        "quiz",
        "flashcard",
        "mindmap",
        "socratic",
        "game",
        "teach_back",
        "devils_advocate",
        "bias_detection",
      ],
    }),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    durationMinutes: integer("duration_minutes"),
    xpEarned: integer("xp_earned").default(0),
    conceptsCovered: text("concepts_covered", { mode: "json" }).$type<
      string[]
    >(),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
    contentIdx: index("sessions_content_idx").on(table.contentId),
  })
);

// ============================================
// AI CACHE
// ============================================

export const aiCache = sqliteTable(
  "ai_cache",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    task: text("task").notNull(),
    contentHash: text("content_hash").notNull(),
    promptHash: text("prompt_hash").notNull(),
    modelUsed: text("model_used"),
    result: text("result", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    cacheIdx: uniqueIndex("ai_cache_unique_idx").on(
      table.task,
      table.contentHash,
      table.promptHash
    ),
  })
);

// ============================================
// TEACH-BACK RESPONSES
// ============================================

export const teachBackResponses = sqliteTable(
  "teach_back_responses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id),
    userExplanation: text("user_explanation").notNull(),
    aiFeedback: text("ai_feedback"),
    reasoningScore: real("reasoning_score"),
    completenessScore: real("completeness_score"),
    accuracyScore: real("accuracy_score"),
    criticalThinkingScore: real("critical_thinking_score"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
  },
  (table) => ({
    userIdx: index("teach_back_user_idx").on(table.userId),
    conceptIdx: index("teach_back_concept_idx").on(table.conceptId),
  })
);

// ============================================
// CRITICAL THINKING: SOCRATIC SESSIONS
// ============================================

export const socraticSessions = sqliteTable(
  "socratic_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id),
    status: text("status", { enum: ["active", "completed"] }).default(
      "active"
    ),
    messages: text("messages", { mode: "json" }).$type<
      Array<{ role: "ai" | "user"; content: string; timestamp: number }>
    >(),
    depthScore: real("depth_score"),
    evidenceScore: real("evidence_score"),
    alternativesScore: real("alternatives_score"),
    coherenceScore: real("coherence_score"),
    overallScore: real("overall_score"),
    questionsAsked: integer("questions_asked").default(0),
    xpEarned: integer("xp_earned").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    userIdx: index("socratic_user_idx").on(table.userId),
    contentIdx: index("socratic_content_idx").on(table.contentId),
  })
);

// ============================================
// CRITICAL THINKING: DEVIL'S ADVOCATE DEBATES
// ============================================

export const devilsAdvocateDebates = sqliteTable(
  "devils_advocate_debates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    argumentId: text("argument_id").references(() => arguments_.id),
    originalClaim: text("original_claim").notNull(),
    steelManMode: integer("steel_man_mode", { mode: "boolean" }).default(
      false
    ),
    status: text("status", { enum: ["active", "completed"] }).default(
      "active"
    ),
    messages: text("messages", { mode: "json" }).$type<
      Array<{ role: "ai" | "user"; content: string; timestamp: number }>
    >(),
    reasoningScore: real("reasoning_score"),
    evidenceScore: real("evidence_score"),
    counterPointsScore: real("counter_points_score"),
    overallScore: real("overall_score"),
    xpEarned: integer("xp_earned").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    userIdx: index("devils_advocate_user_idx").on(table.userId),
    contentIdx: index("devils_advocate_content_idx").on(table.contentId),
  })
);

// ============================================
// CRITICAL THINKING: BIAS DETECTION EXERCISES
// ============================================

export const biasDetectionExercises = sqliteTable(
  "bias_detection_exercises",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    contentId: text("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    chunkId: text("chunk_id").references(() => contentChunks.id),
    passage: text("passage").notNull(),
    guidedQuestions: text("guided_questions", { mode: "json" }).$type<
      string[]
    >(),
    userResponses: text("user_responses", { mode: "json" }).$type<
      Array<{ question: string; answer: string }>
    >(),
    aiFeedback: text("ai_feedback"),
    perspectiveScore: real("perspective_score"),
    factOpinionScore: real("fact_opinion_score"),
    biasIdentificationScore: real("bias_identification_score"),
    overallScore: real("overall_score"),
    xpEarned: integer("xp_earned").default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(
      () => new Date()
    ),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    userIdx: index("bias_detection_user_idx").on(table.userId),
    contentIdx: index("bias_detection_content_idx").on(table.contentId),
  })
);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  contents: many(contents),
  accounts: many(accounts),
  sessions: many(sessions),
  progress: many(userProgress),
  quizAttempts: many(quizAttempts),
}));

export const contentsRelations = relations(contents, ({ one, many }) => ({
  user: one(users, { fields: [contents.userId], references: [users.id] }),
  chunks: many(contentChunks),
  concepts: many(concepts),
  relationships: many(conceptRelationships),
  questions: many(questions),
  flashcards: many(flashcards),
  arguments: many(arguments_),
}));

export const contentChunksRelations = relations(contentChunks, ({ one }) => ({
  content: one(contents, {
    fields: [contentChunks.contentId],
    references: [contents.id],
  }),
}));

export const conceptsRelations = relations(concepts, ({ one, many }) => ({
  content: one(contents, {
    fields: [concepts.contentId],
    references: [contents.id],
  }),
  chunk: one(contentChunks, {
    fields: [concepts.chunkId],
    references: [contentChunks.id],
  }),
  outgoingRelationships: many(conceptRelationships, {
    relationName: "source",
  }),
  incomingRelationships: many(conceptRelationships, {
    relationName: "target",
  }),
}));

export const conceptRelationshipsRelations = relations(
  conceptRelationships,
  ({ one }) => ({
    content: one(contents, {
      fields: [conceptRelationships.contentId],
      references: [contents.id],
    }),
    sourceConcept: one(concepts, {
      fields: [conceptRelationships.sourceConceptId],
      references: [concepts.id],
      relationName: "source",
    }),
    targetConcept: one(concepts, {
      fields: [conceptRelationships.targetConceptId],
      references: [concepts.id],
      relationName: "target",
    }),
  })
);
