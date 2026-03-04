CREATE TABLE `accounts` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `provider_account_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`task` text NOT NULL,
	`content_hash` text NOT NULL,
	`prompt_hash` text NOT NULL,
	`model_used` text,
	`result` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_cache_unique_idx` ON `ai_cache` (`task`,`content_hash`,`prompt_hash`);--> statement-breakpoint
CREATE TABLE `arguments` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`chunk_id` text,
	`thesis` text NOT NULL,
	`premises` text,
	`evidence` text,
	`assumptions` text,
	`conclusion` text,
	`logical_structure` text,
	`fallacies` text,
	`strength_score` real DEFAULT 0.5,
	`counter_arguments` text,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chunk_id`) REFERENCES `content_chunks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `arguments_content_idx` ON `arguments` (`content_id`);--> statement-breakpoint
CREATE TABLE `bias_detection_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`chunk_id` text,
	`passage` text NOT NULL,
	`guided_questions` text,
	`user_responses` text,
	`ai_feedback` text,
	`perspective_score` real,
	`fact_opinion_score` real,
	`bias_identification_score` real,
	`overall_score` real,
	`xp_earned` integer DEFAULT 0,
	`created_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chunk_id`) REFERENCES `content_chunks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bias_detection_user_idx` ON `bias_detection_exercises` (`user_id`);--> statement-breakpoint
CREATE INDEX `bias_detection_content_idx` ON `bias_detection_exercises` (`content_id`);--> statement-breakpoint
CREATE TABLE `concept_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`source_concept_id` text NOT NULL,
	`target_concept_id` text NOT NULL,
	`relationship_type` text,
	`strength` real DEFAULT 0.5,
	`description` text,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `relationships_content_idx` ON `concept_relationships` (`content_id`);--> statement-breakpoint
CREATE INDEX `relationships_source_idx` ON `concept_relationships` (`source_concept_id`);--> statement-breakpoint
CREATE INDEX `relationships_target_idx` ON `concept_relationships` (`target_concept_id`);--> statement-breakpoint
CREATE TABLE `concepts` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`chunk_id` text,
	`name` text NOT NULL,
	`definition` text NOT NULL,
	`detailed_explanation` text,
	`source_excerpt` text,
	`concept_type` text,
	`difficulty_level` integer DEFAULT 1,
	`blooms_level` text,
	`prerequisites` text,
	`tags` text,
	`importance_score` real DEFAULT 0.5,
	`created_at` integer,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chunk_id`) REFERENCES `content_chunks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `concepts_content_idx` ON `concepts` (`content_id`);--> statement-breakpoint
CREATE TABLE `content_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`chapter_title` text,
	`section_title` text,
	`text` text NOT NULL,
	`token_count` integer,
	`metadata` text,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chunks_content_idx` ON `content_chunks` (`content_id`);--> statement-breakpoint
CREATE TABLE `contents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`source_type` text NOT NULL,
	`source_url` text,
	`file_name` text,
	`file_path` text,
	`file_size` integer,
	`mime_type` text,
	`raw_text` text,
	`content_hash` text,
	`total_chunks` integer DEFAULT 0,
	`total_concepts` integer DEFAULT 0,
	`processing_status` text DEFAULT 'pending' NOT NULL,
	`processing_error` text,
	`processing_progress` integer DEFAULT 0,
	`metadata` text,
	`is_favorited` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contents_user_idx` ON `contents` (`user_id`);--> statement-breakpoint
CREATE INDEX `contents_status_idx` ON `contents` (`processing_status`);--> statement-breakpoint
CREATE TABLE `devils_advocate_debates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`argument_id` text,
	`original_claim` text NOT NULL,
	`steel_man_mode` integer DEFAULT false,
	`status` text DEFAULT 'active',
	`messages` text,
	`reasoning_score` real,
	`evidence_score` real,
	`counter_points_score` real,
	`overall_score` real,
	`xp_earned` integer DEFAULT 0,
	`created_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`argument_id`) REFERENCES `arguments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `devils_advocate_user_idx` ON `devils_advocate_debates` (`user_id`);--> statement-breakpoint
CREATE INDEX `devils_advocate_content_idx` ON `devils_advocate_debates` (`content_id`);--> statement-breakpoint
CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`concept_id` text,
	`front_text` text NOT NULL,
	`back_text` text NOT NULL,
	`difficulty_level` integer DEFAULT 1,
	`created_at` integer,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `flashcards_content_idx` ON `flashcards` (`content_id`);--> statement-breakpoint
CREATE TABLE `learning_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`session_type` text,
	`started_at` integer,
	`ended_at` integer,
	`duration_minutes` integer,
	`xp_earned` integer DEFAULT 0,
	`concepts_covered` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `learning_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_content_idx` ON `learning_sessions` (`content_id`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`concept_id` text,
	`chunk_id` text,
	`question_type` text NOT NULL,
	`question_text` text NOT NULL,
	`options` text,
	`correct_answer` text,
	`explanation` text,
	`difficulty_level` integer DEFAULT 1,
	`blooms_level` text,
	`points` integer DEFAULT 10,
	`time_limit_seconds` integer DEFAULT 60,
	`tags` text,
	`created_at` integer,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`chunk_id`) REFERENCES `content_chunks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `questions_content_idx` ON `questions` (`content_id`);--> statement-breakpoint
CREATE INDEX `questions_concept_idx` ON `questions` (`concept_id`);--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`quiz_type` text NOT NULL,
	`questions_attempted` integer DEFAULT 0,
	`questions_correct` integer DEFAULT 0,
	`score` integer DEFAULT 0,
	`max_score` integer DEFAULT 0,
	`time_taken_seconds` integer,
	`difficulty_level` integer DEFAULT 1,
	`answers` text,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `quiz_attempts_user_idx` ON `quiz_attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_content_idx` ON `quiz_attempts` (`content_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `socratic_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`concept_id` text,
	`status` text DEFAULT 'active',
	`messages` text,
	`depth_score` real,
	`evidence_score` real,
	`alternatives_score` real,
	`coherence_score` real,
	`overall_score` real,
	`questions_asked` integer DEFAULT 0,
	`xp_earned` integer DEFAULT 0,
	`created_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `socratic_user_idx` ON `socratic_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `socratic_content_idx` ON `socratic_sessions` (`content_id`);--> statement-breakpoint
CREATE TABLE `teach_back_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`concept_id` text NOT NULL,
	`user_explanation` text NOT NULL,
	`ai_feedback` text,
	`reasoning_score` real,
	`completeness_score` real,
	`accuracy_score` real,
	`critical_thinking_score` real,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teach_back_user_idx` ON `teach_back_responses` (`user_id`);--> statement-breakpoint
CREATE INDEX `teach_back_concept_idx` ON `teach_back_responses` (`concept_id`);--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`concept_id` text NOT NULL,
	`mastery_level` real DEFAULT 0,
	`blooms_achieved` text DEFAULT 'remember',
	`times_reviewed` integer DEFAULT 0,
	`times_correct` integer DEFAULT 0,
	`times_incorrect` integer DEFAULT 0,
	`last_reviewed_at` integer,
	`next_review_at` integer,
	`ease_factor` real DEFAULT 2.5,
	`interval_days` integer DEFAULT 1,
	`streak` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `contents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_progress_unique_idx` ON `user_progress` (`user_id`,`content_id`,`concept_id`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`total_xp` integer DEFAULT 0,
	`level` integer DEFAULT 1,
	`current_streak` integer DEFAULT 0,
	`longest_streak` integer DEFAULT 0,
	`last_activity_date` text,
	`total_concepts_mastered` integer DEFAULT 0,
	`total_quizzes_completed` integer DEFAULT 0,
	`total_time_spent_minutes` integer DEFAULT 0,
	`badges` text,
	`achievements` text,
	`weekly_xp` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_stats_user_id_unique` ON `user_stats` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`email_verified` integer,
	`image` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
