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
import type { StatusEmitter } from "./status";
import type { ExtractedConcept } from "@/lib/ai/prompts/concept-extraction";
import type { ExtractedRelationship } from "@/lib/ai/prompts/relationship-mapping";
import type {
  GeneratedQuestion,
  GeneratedFlashcard,
} from "@/lib/ai/prompts/quiz-generation";
import type { ExtractedArgument } from "@/lib/ai/prompts/argument-extraction";
import { readFile } from "fs/promises";
import path from "path";
import { createHash } from "crypto";

type ProcessingStatus =
  | "pending"
  | "extracting"
  | "chunking"
  | "analyzing"
  | "generating"
  | "completed"
  | "failed";

function updateStatus(
  contentId: string,
  status: ProcessingStatus,
  progress: number,
  emitter?: StatusEmitter,
  message?: string
) {
  db.update(contents)
    .set({
      processingStatus: status,
      processingProgress: progress,
      updatedAt: new Date(),
    })
    .where(eq(contents.id, contentId))
    .run();

  emitter?.emit({ status, progress, message: message || status });
}

export async function processContent(
  contentId: string,
  emitter?: StatusEmitter
): Promise<void> {
  try {
    // Fetch content record
    const content = db
      .select()
      .from(contents)
      .where(eq(contents.id, contentId))
      .get();

    if (!content) throw new Error("Content not found");

    // ---- STEP 1: Extract Text ----
    updateStatus(contentId, "extracting", 5, emitter, "Extracting text from source...");

    let rawText = content.rawText;
    if (!rawText) {
      if (content.sourceType === "youtube" && content.sourceUrl) {
        const result = await extractText("youtube", content.sourceUrl);
        rawText = result.text;
      } else if (content.sourceType === "url" && content.sourceUrl) {
        const result = await extractText("url", content.sourceUrl);
        rawText = result.text;
      } else if (content.filePath) {
        const filePath = path.join(process.cwd(), content.filePath);
        const buffer = await readFile(filePath);
        const result = await extractText(
          content.sourceType as "pdf" | "docx" | "epub",
          buffer
        );
        rawText = result.text;
      }

      if (rawText) {
        db.update(contents)
          .set({ rawText })
          .where(eq(contents.id, contentId))
          .run();
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("No text could be extracted from the content");
    }

    const contentHash = createHash("sha256").update(rawText).digest("hex");
    db.update(contents)
      .set({ contentHash })
      .where(eq(contents.id, contentId))
      .run();

    // ---- STEP 2: Chunk Text ----
    updateStatus(contentId, "chunking", 15, emitter, "Splitting content into chunks...");

    const chunks = chunkText(rawText);
    const chunkRecords: { id: string; text: string; index: number }[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const result = db
        .insert(contentChunks)
        .values({
          contentId,
          chunkIndex: i,
          text: chunks[i],
          tokenCount: estimateTokens(chunks[i]),
        })
        .returning()
        .get();
      chunkRecords.push({ id: result.id, text: chunks[i], index: i });
    }

    db.update(contents)
      .set({ totalChunks: chunks.length })
      .where(eq(contents.id, contentId))
      .run();

    // ---- STEP 3: Extract Concepts (per chunk) ----
    updateStatus(contentId, "analyzing", 25, emitter, "Identifying key concepts...");

    const allConcepts: (ExtractedConcept & { chunkId: string })[] = [];
    const maxChunksToProcess = Math.min(chunks.length, 50);

    for (let i = 0; i < maxChunksToProcess; i++) {
      try {
        const prompt = buildConceptExtractionPrompt(chunkRecords[i].text, i);
        const response = await aiComplete({
          messages: prompt,
          taskType: "concept_extraction",
          responseFormat: "json",
        });

        const parsed = safeJsonParse<{ concepts: ExtractedConcept[] }>(
          response.content
        );
        if (parsed?.concepts) {
          allConcepts.push(
            ...parsed.concepts.map((c) => ({
              ...c,
              chunkId: chunkRecords[i].id,
            }))
          );
        }
      } catch (err) {
        console.error(`Concept extraction failed for chunk ${i}:`, err);
      }

      const progress = 25 + Math.round((i / maxChunksToProcess) * 20);
      updateStatus(
        contentId,
        "analyzing",
        progress,
        emitter,
        `Analyzed chunk ${i + 1} of ${maxChunksToProcess}`
      );
    }

    // Deduplicate concepts by name, keeping highest importance
    const conceptMap = new Map<string, (typeof allConcepts)[0]>();
    for (const c of allConcepts) {
      const key = c.name.toLowerCase().trim();
      const existing = conceptMap.get(key);
      if (!existing || (c.importance_score || 0) > (existing.importance_score || 0)) {
        conceptMap.set(key, c);
      }
    }
    const uniqueConcepts = Array.from(conceptMap.values());

    // Insert concepts into DB
    const insertedConcepts: { id: string; name: string }[] = [];
    for (const c of uniqueConcepts) {
      try {
        const result = db
          .insert(concepts)
          .values({
            contentId: contentId,
            chunkId: c.chunkId,
            name: c.name,
            definition: c.definition || c.name,
            detailedExplanation: c.detailed_explanation,
            sourceExcerpt: c.source_excerpt,
            conceptType: (isValidConceptType(c.concept_type)
              ? c.concept_type
              : "term") as "term",
            difficultyLevel: Math.min(5, Math.max(1, c.difficulty_level || 1)),
            bloomsLevel: (isValidBloomsLevel(c.blooms_level)
              ? c.blooms_level
              : "remember") as "remember",
            prerequisites: c.prerequisites || [],
            tags: c.tags || [],
            importanceScore: c.importance_score || 0.5,
          })
          .returning()
          .get();
        insertedConcepts.push({ id: result.id, name: result.name });
      } catch (err) {
        console.error(`Failed to insert concept ${c.name}:`, err);
      }
    }

    db.update(contents)
      .set({ totalConcepts: insertedConcepts.length })
      .where(eq(contents.id, contentId))
      .run();

    // ---- STEP 4: Map Relationships ----
    updateStatus(
      contentId,
      "analyzing",
      50,
      emitter,
      "Mapping concept relationships..."
    );

    if (insertedConcepts.length >= 2) {
      try {
        // Process relationships in batches of 30 concepts
        const batchSize = 30;
        for (let i = 0; i < insertedConcepts.length; i += batchSize) {
          const batch = uniqueConcepts.slice(i, i + batchSize);
          const prompt = buildRelationshipMappingPrompt(
            batch.map((c) => ({ name: c.name, definition: c.definition }))
          );
          const relResponse = await aiComplete({
            messages: prompt,
            taskType: "relationship_mapping",
            responseFormat: "json",
          });

          const parsed = safeJsonParse<{
            relationships: ExtractedRelationship[];
          }>(relResponse.content);

          if (parsed?.relationships) {
            const conceptIdLookup = new Map(
              insertedConcepts.map((c) => [c.name.toLowerCase(), c.id])
            );

            for (const rel of parsed.relationships) {
              const sourceId = conceptIdLookup.get(rel.source?.toLowerCase());
              const targetId = conceptIdLookup.get(rel.target?.toLowerCase());
              if (sourceId && targetId && sourceId !== targetId) {
                try {
                  db.insert(conceptRelationships)
                    .values({
                      contentId,
                      sourceConceptId: sourceId,
                      targetConceptId: targetId,
                      relationshipType: isValidRelType(rel.type)
                        ? (rel.type as any)
                        : "related",
                      strength: rel.strength || 0.5,
                      description: rel.description,
                    })
                    .run();
                } catch {
                  // Skip duplicate relationships
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Relationship mapping failed:", err);
      }
    }

    // ---- STEP 5: Extract Arguments ----
    updateStatus(contentId, "analyzing", 58, emitter, "Extracting arguments...");

    for (let i = 0; i < Math.min(maxChunksToProcess, 20); i++) {
      try {
        const prompt = buildArgumentExtractionPrompt(chunkRecords[i].text);
        const response = await aiComplete({
          messages: prompt,
          taskType: "argument_extraction",
          responseFormat: "json",
        });

        const parsed = safeJsonParse<{ arguments: ExtractedArgument[] }>(
          response.content
        );
        if (parsed?.arguments) {
          for (const arg of parsed.arguments) {
            db.insert(arguments_)
              .values({
                contentId,
                chunkId: chunkRecords[i].id,
                thesis: arg.thesis,
                premises: arg.premises || [],
                evidence: arg.evidence || [],
                assumptions: arg.assumptions || [],
                conclusion: arg.conclusion,
                logicalStructure: arg.logical_structure,
                fallacies: arg.fallacies || [],
                strengthScore: arg.strength_score || 0.5,
                counterArguments: arg.counter_arguments || [],
              })
              .run();
          }
        }
      } catch (err) {
        console.error(`Argument extraction failed for chunk ${i}:`, err);
      }
    }

    // ---- STEP 6: Generate Quizzes ----
    updateStatus(contentId, "generating", 65, emitter, "Generating quiz questions...");

    const conceptsForQuiz = uniqueConcepts.slice(0, 15).map((c) => ({
      name: c.name,
      definition: c.definition,
    }));
    const textContext = rawText.slice(0, 6000);
    const conceptIdLookup = new Map(
      insertedConcepts.map((c) => [c.name.toLowerCase(), c.id])
    );

    for (const difficulty of ["easy", "medium", "hard"] as const) {
      try {
        const prompt = buildQuizGenerationPrompt(
          textContext,
          conceptsForQuiz,
          difficulty
        );
        const response = await aiComplete({
          messages: prompt,
          taskType: "mcq_generation",
          responseFormat: "json",
        });

        const parsed = safeJsonParse<{ questions: GeneratedQuestion[] }>(
          response.content
        );
        if (parsed?.questions) {
          for (const q of parsed.questions) {
            const conceptId = q.related_concept
              ? conceptIdLookup.get(q.related_concept.toLowerCase()) || null
              : null;

            db.insert(questions)
              .values({
                contentId,
                conceptId,
                questionType: (isValidQuestionType(q.question_type)
                  ? q.question_type
                  : "mcq") as "mcq",
                questionText: q.question_text,
                options: q.options || null,
                correctAnswer: q.correct_answer,
                explanation: q.explanation,
                difficultyLevel: q.difficulty_level || 1,
                bloomsLevel: (isValidBloomsLevel(q.blooms_level)
                  ? q.blooms_level
                  : "remember") as "remember",
                points: q.points || 10,
                timeLimitSeconds: q.time_limit_seconds || 60,
              })
              .run();
          }
        }
      } catch (err) {
        console.error(`Quiz generation (${difficulty}) failed:`, err);
      }
    }

    // ---- STEP 7: Generate Flashcards ----
    updateStatus(contentId, "generating", 80, emitter, "Creating flashcards...");

    try {
      const conceptsForFlashcards = uniqueConcepts.slice(0, 30).map((c) => ({
        name: c.name,
        definition: c.definition,
        detailed_explanation: c.detailed_explanation,
      }));
      const prompt = buildFlashcardGenerationPrompt(conceptsForFlashcards);
      const response = await aiComplete({
        messages: prompt,
        taskType: "flashcard_generation",
        responseFormat: "json",
      });

      const parsed = safeJsonParse<{ flashcards: GeneratedFlashcard[] }>(
        response.content
      );
      if (parsed?.flashcards) {
        for (const fc of parsed.flashcards) {
          const conceptId = findMatchingConcept(fc.front_text, conceptIdLookup);
          db.insert(flashcards)
            .values({
              contentId,
              conceptId,
              frontText: fc.front_text,
              backText: fc.back_text,
              difficultyLevel: fc.difficulty_level || 1,
            })
            .run();
        }
      }
    } catch (err) {
      console.error("Flashcard generation failed:", err);
    }

    // ---- DONE ----
    updateStatus(contentId, "completed", 100, emitter, "Processing complete!");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    db.update(contents)
      .set({
        processingStatus: "failed",
        processingError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(contents.id, contentId))
      .run();

    emitter?.emit({ status: "failed", progress: 0, message: errorMessage });
    throw error;
  }
}

// Validation helpers
function isValidConceptType(type: string): boolean {
  return [
    "term", "theory", "argument", "fact", "process",
    "principle", "example", "person", "event", "formula",
  ].includes(type);
}

function isValidBloomsLevel(level: string): boolean {
  return [
    "remember", "understand", "apply", "analyze", "evaluate", "create",
  ].includes(level);
}

function isValidRelType(type: string): boolean {
  return [
    "prerequisite", "related", "contradicts", "supports",
    "part_of", "causes", "example_of", "opposite",
  ].includes(type);
}

function isValidQuestionType(type: string): boolean {
  return [
    "mcq", "true_false", "fill_blank", "short_answer",
    "explain", "sequence", "match", "scenario",
  ].includes(type);
}

function findMatchingConcept(
  text: string,
  conceptIdLookup: Map<string, string>
): string | null {
  const lowerText = text.toLowerCase();
  for (const [name, id] of conceptIdLookup) {
    if (lowerText.includes(name)) return id;
  }
  return null;
}
