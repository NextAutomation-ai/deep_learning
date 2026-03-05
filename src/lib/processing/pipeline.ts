import { db } from "@/lib/db";
import {
  contents,
  contentChunks,
  concepts,
  conceptRelationships,
  questions,
  flashcards,
  arguments_,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractText } from "./extractors";
import { chunkText, estimateTokens } from "./chunker";
import { aiComplete } from "@/lib/ai/router";
import { safeJsonParse } from "@/lib/utils/errors";
import { buildConceptExtractionPrompt } from "@/lib/ai/prompts/concept-extraction";
import { buildRelationshipMappingPrompt } from "@/lib/ai/prompts/relationship-mapping";
import {
  buildQuizGenerationPrompt,
  buildFlashcardGenerationPrompt,
} from "@/lib/ai/prompts/quiz-generation";
import { buildArgumentExtractionPrompt } from "@/lib/ai/prompts/argument-extraction";
import type { ExtractedConcept } from "@/lib/ai/prompts/concept-extraction";
import type { ExtractedRelationship } from "@/lib/ai/prompts/relationship-mapping";
import type {
  GeneratedQuestion,
  GeneratedFlashcard,
} from "@/lib/ai/prompts/quiz-generation";
import type { ExtractedArgument } from "@/lib/ai/prompts/argument-extraction";
import { downloadFile } from "@/lib/storage/supabase";
import { createHash } from "crypto";

const BATCH_SIZE = 3; // Smaller batches = faster per-step, fits in 60s window

async function updateStatus(
  contentId: string,
  status: "pending" | "extracting" | "chunking" | "analyzing" | "generating" | "completed" | "failed",
  progress: number,
  message?: string
) {
  await db.update(contents)
    .set({
      processingStatus: status,
      processingProgress: progress,
      updatedAt: new Date(),
    })
    .where(eq(contents.id, contentId));
}

/**
 * Resumable processing pipeline.
 * Each step checks if its data already exists and skips if so.
 * Designed to be called multiple times — each call does ~45s of work
 * before Vercel's 60s timeout kills it. The next call continues.
 */
export async function processContent(contentId: string): Promise<void> {
  try {
    const [content] = await db
      .select()
      .from(contents)
      .where(eq(contents.id, contentId))
      .limit(1);

    if (!content) throw new Error("Content not found");

    // ---- STEP 1: Extract Text ----
    let rawText = content.rawText;
    if (!rawText) {
      await updateStatus(contentId, "extracting", 5, "Extracting text...");

      if (content.sourceType === "youtube" && content.sourceUrl) {
        const result = await extractText("youtube", content.sourceUrl);
        rawText = result.text;
      } else if (content.sourceType === "url" && content.sourceUrl) {
        const result = await extractText("url", content.sourceUrl);
        rawText = result.text;
      } else if (content.filePath) {
        const buffer = await downloadFile(content.filePath);
        const result = await extractText(
          content.sourceType as "pdf" | "docx" | "epub",
          buffer
        );
        rawText = result.text;
      }

      if (rawText) {
        const contentHash = createHash("sha256").update(rawText).digest("hex");
        await db.update(contents)
          .set({ rawText, contentHash })
          .where(eq(contents.id, contentId));
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("We couldn't read any text from this file. Please try a different file.");
    }

    // ---- STEP 2: Chunk Text (skip if already done) ----
    let existingChunks = await db
      .select()
      .from(contentChunks)
      .where(eq(contentChunks.contentId, contentId));

    if (existingChunks.length === 0) {
      await updateStatus(contentId, "chunking", 15, "Splitting into sections...");

      const chunks = chunkText(rawText);
      for (let i = 0; i < chunks.length; i++) {
        await db.insert(contentChunks)
          .values({
            contentId,
            chunkIndex: i,
            text: chunks[i],
            tokenCount: estimateTokens(chunks[i]),
          });
      }

      await db.update(contents)
        .set({ totalChunks: chunks.length })
        .where(eq(contents.id, contentId));

      existingChunks = await db
        .select()
        .from(contentChunks)
        .where(eq(contentChunks.contentId, contentId));
    }

    const chunkRecords = existingChunks.map((c) => ({
      id: c.id,
      text: c.text,
      index: c.chunkIndex,
    }));

    // ---- STEP 3: Extract Concepts (skip if already done) ----
    let existingConcepts = await db
      .select()
      .from(concepts)
      .where(eq(concepts.contentId, contentId));

    if (existingConcepts.length === 0) {
      await updateStatus(contentId, "analyzing", 25, "Identifying key concepts...");

      const maxChunks = Math.min(chunkRecords.length, 10); // Limit chunks for speed
      const allConcepts: (ExtractedConcept & { chunkId: string })[] = [];

      for (let i = 0; i < maxChunks; i += BATCH_SIZE) {
        const batch = chunkRecords.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (chunk) => {
            const prompt = buildConceptExtractionPrompt(chunk.text, chunk.index);
            const response = await aiComplete({
              messages: prompt,
              taskType: "concept_extraction",
              responseFormat: "json",
            });
            const parsed = safeJsonParse<{ concepts: ExtractedConcept[] }>(response.content);
            return (parsed?.concepts || []).map((c) => ({ ...c, chunkId: chunk.id }));
          })
        );
        for (const r of batchResults) {
          if (r.status === "fulfilled") allConcepts.push(...r.value);
        }
        const progress = 25 + Math.round(((i + BATCH_SIZE) / maxChunks) * 25);
        await updateStatus(contentId, "analyzing", Math.min(progress, 50));
      }

      // Deduplicate
      const conceptMap = new Map<string, (typeof allConcepts)[0]>();
      for (const c of allConcepts) {
        const key = c.name.toLowerCase().trim();
        const existing = conceptMap.get(key);
        if (!existing || (c.importance_score || 0) > (existing.importance_score || 0)) {
          conceptMap.set(key, c);
        }
      }

      // Insert
      for (const c of conceptMap.values()) {
        try {
          await db.insert(concepts).values({
            contentId,
            chunkId: c.chunkId,
            name: c.name,
            definition: c.definition || c.name,
            detailedExplanation: c.detailed_explanation,
            sourceExcerpt: c.source_excerpt,
            conceptType: (isValidConceptType(c.concept_type) ? c.concept_type : "term") as "term",
            difficultyLevel: Math.min(5, Math.max(1, c.difficulty_level || 1)),
            bloomsLevel: (isValidBloomsLevel(c.blooms_level) ? c.blooms_level : "remember") as "remember",
            prerequisites: c.prerequisites || [],
            tags: c.tags || [],
            importanceScore: c.importance_score || 0.5,
          });
        } catch { /* skip duplicates */ }
      }

      existingConcepts = await db.select().from(concepts).where(eq(concepts.contentId, contentId));
      await db.update(contents).set({ totalConcepts: existingConcepts.length }).where(eq(contents.id, contentId));
    }

    const insertedConcepts = existingConcepts.map((c) => ({ id: c.id, name: c.name }));
    const conceptIdLookup = new Map(insertedConcepts.map((c) => [c.name.toLowerCase(), c.id]));

    // ---- STEP 4: Map Relationships (skip if already done) ----
    const existingRels = await db
      .select()
      .from(conceptRelationships)
      .where(eq(conceptRelationships.contentId, contentId));

    if (existingRels.length === 0 && insertedConcepts.length >= 2) {
      await updateStatus(contentId, "analyzing", 55, "Mapping concept relationships...");

      try {
        const conceptsForMapping = existingConcepts.slice(0, 30).map((c) => ({
          name: c.name,
          definition: c.definition,
        }));
        const prompt = buildRelationshipMappingPrompt(conceptsForMapping);
        const relResponse = await aiComplete({
          messages: prompt,
          taskType: "relationship_mapping",
          responseFormat: "json",
        });
        const parsed = safeJsonParse<{ relationships: ExtractedRelationship[] }>(relResponse.content);
        if (parsed?.relationships) {
          for (const rel of parsed.relationships) {
            const sourceId = conceptIdLookup.get(rel.source?.toLowerCase());
            const targetId = conceptIdLookup.get(rel.target?.toLowerCase());
            if (sourceId && targetId && sourceId !== targetId) {
              try {
                await db.insert(conceptRelationships).values({
                  contentId,
                  sourceConceptId: sourceId,
                  targetConceptId: targetId,
                  relationshipType: isValidRelType(rel.type) ? (rel.type as any) : "related",
                  strength: rel.strength || 0.5,
                  description: rel.description,
                });
              } catch { /* skip duplicates */ }
            }
          }
        }
      } catch (err) {
        console.error("Relationship mapping failed:", err);
      }
    }

    // ---- STEP 5: Extract Arguments (skip if already done) ----
    const existingArgs = await db
      .select()
      .from(arguments_)
      .where(eq(arguments_.contentId, contentId));

    if (existingArgs.length === 0) {
      await updateStatus(contentId, "analyzing", 60, "Extracting arguments...");

      const argChunks = chunkRecords.slice(0, Math.min(chunkRecords.length, 5)); // Limit for speed
      for (let i = 0; i < argChunks.length; i += BATCH_SIZE) {
        const batch = argChunks.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (chunk) => {
            const prompt = buildArgumentExtractionPrompt(chunk.text);
            const response = await aiComplete({
              messages: prompt,
              taskType: "argument_extraction",
              responseFormat: "json",
            });
            const parsed = safeJsonParse<{ arguments: ExtractedArgument[] }>(response.content);
            if (parsed?.arguments) {
              for (const arg of parsed.arguments) {
                await db.insert(arguments_).values({
                  contentId,
                  chunkId: chunk.id,
                  thesis: arg.thesis,
                  premises: arg.premises || [],
                  evidence: arg.evidence || [],
                  assumptions: arg.assumptions || [],
                  conclusion: arg.conclusion,
                  logicalStructure: arg.logical_structure,
                  fallacies: arg.fallacies || [],
                  strengthScore: arg.strength_score || 0.5,
                  counterArguments: arg.counter_arguments || [],
                });
              }
            }
          })
        );
      }
    }

    // ---- STEP 6: Generate Quizzes (skip if already done) ----
    const existingQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.contentId, contentId));

    if (existingQuestions.length === 0) {
      await updateStatus(contentId, "generating", 75, "Generating quiz questions...");

      const conceptsForQuiz = existingConcepts.slice(0, 15).map((c) => ({
        name: c.name,
        definition: c.definition,
      }));
      const textContext = rawText.slice(0, 6000);

      // Generate one difficulty at a time to fit in timeout
      for (const difficulty of ["easy", "medium", "hard"] as const) {
        try {
          const prompt = buildQuizGenerationPrompt(textContext, conceptsForQuiz, difficulty);
          const response = await aiComplete({
            messages: prompt,
            taskType: "mcq_generation",
            responseFormat: "json",
          });
          const parsed = safeJsonParse<{ questions: GeneratedQuestion[] }>(response.content);
          if (parsed?.questions) {
            for (const q of parsed.questions) {
              const conceptId = q.related_concept
                ? conceptIdLookup.get(q.related_concept.toLowerCase()) || null
                : null;
              await db.insert(questions).values({
                contentId,
                conceptId,
                questionType: (isValidQuestionType(q.question_type) ? q.question_type : "mcq") as "mcq",
                questionText: q.question_text,
                options: q.options || null,
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                difficultyLevel: q.difficulty_level || 1,
                bloomsLevel: (isValidBloomsLevel(q.blooms_level) ? q.blooms_level : "remember") as "remember",
                points: q.points || 10,
                timeLimitSeconds: q.time_limit_seconds || 60,
              });
            }
          }
        } catch (err) {
          console.error(`Quiz generation (${difficulty}) failed:`, err);
        }
      }
    }

    // ---- STEP 7: Generate Flashcards (skip if already done) ----
    const existingFlashcards = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.contentId, contentId));

    if (existingFlashcards.length === 0) {
      await updateStatus(contentId, "generating", 85, "Creating flashcards...");

      try {
        const conceptsForFlashcards = existingConcepts.slice(0, 30).map((c) => ({
          name: c.name,
          definition: c.definition,
          detailed_explanation: c.detailedExplanation || undefined,
        }));
        const prompt = buildFlashcardGenerationPrompt(conceptsForFlashcards);
        const response = await aiComplete({
          messages: prompt,
          taskType: "flashcard_generation",
          responseFormat: "json",
        });
        const parsed = safeJsonParse<{ flashcards: GeneratedFlashcard[] }>(response.content);
        if (parsed?.flashcards) {
          for (const fc of parsed.flashcards) {
            const conceptId = findMatchingConcept(fc.front_text, conceptIdLookup);
            await db.insert(flashcards).values({
              contentId,
              conceptId,
              frontText: fc.front_text,
              backText: fc.back_text,
              difficultyLevel: fc.difficulty_level || 1,
            });
          }
        }
      } catch (err) {
        console.error("Flashcard generation failed:", err);
      }
    }

    // ---- DONE ----
    await updateStatus(contentId, "completed", 100, "Processing complete!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
    await db.update(contents)
      .set({
        processingStatus: "failed",
        processingError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, contentId));
    throw error;
  }
}

// Validation helpers
function isValidConceptType(type: string): boolean {
  return ["term", "theory", "argument", "fact", "process", "principle", "example", "person", "event", "formula"].includes(type);
}
function isValidBloomsLevel(level: string): boolean {
  return ["remember", "understand", "apply", "analyze", "evaluate", "create"].includes(level);
}
function isValidRelType(type: string): boolean {
  return ["prerequisite", "related", "contradicts", "supports", "part_of", "causes", "example_of", "opposite"].includes(type);
}
function isValidQuestionType(type: string): boolean {
  return ["mcq", "true_false", "fill_blank", "short_answer", "explain", "sequence", "match", "scenario"].includes(type);
}
function findMatchingConcept(text: string, conceptIdLookup: Map<string, string>): string | null {
  const lowerText = text.toLowerCase();
  for (const [name, id] of conceptIdLookup) {
    if (lowerText.includes(name)) return id;
  }
  return null;
}
