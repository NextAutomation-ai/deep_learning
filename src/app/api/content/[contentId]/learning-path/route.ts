import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { concepts, conceptRelationships, contents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { topologicalSort, groupIntoLessons } from "@/lib/learning/path-generator";
import type { Lesson } from "@/lib/learning/path-generator";
import { aiCompleteJson } from "@/lib/ai/router";
import { buildLearningPathPrompt } from "@/lib/ai/prompts/learning-path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;
  if (!verifyContentOwnership(contentId, session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check for cached path in content metadata
  const content = db
    .select()
    .from(contents)
    .where(eq(contents.id, contentId))
    .get();

  if (!content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const metadata = (content.metadata as Record<string, unknown>) || {};
  if (metadata.learningPath) {
    return NextResponse.json({
      lessons: metadata.learningPath as Lesson[],
      cached: true,
    });
  }

  // Generate learning path
  const allConcepts = db
    .select()
    .from(concepts)
    .where(eq(concepts.contentId, contentId))
    .all();

  if (allConcepts.length === 0) {
    return NextResponse.json({ lessons: [], cached: false });
  }

  const relationships = db
    .select()
    .from(conceptRelationships)
    .where(eq(conceptRelationships.contentId, contentId))
    .all();

  // Step 1: Topological sort
  const ordered = topologicalSort(
    allConcepts.map((c) => ({
      id: c.id,
      name: c.name,
      difficultyLevel: c.difficultyLevel ?? 1,
      importanceScore: c.importanceScore,
    })),
    relationships
  );

  // Step 2: Try AI grouping, fall back to heuristic
  let lessons: Lesson[];
  try {
    const messages = buildLearningPathPrompt(
      ordered.map((c) => ({
        name: c.name,
        definition:
          allConcepts.find((ac) => ac.id === c.id)?.definition || "",
        difficulty: c.difficultyLevel,
      }))
    );

    const aiResult = await aiCompleteJson<{
      lessons: Array<{
        title: string;
        description: string;
        conceptNames: string[];
        estimatedMinutes: number;
        difficulty: number;
      }>;
    }>({
      messages,
      taskType: "general",
    });

    if (aiResult?.lessons?.length > 0) {
      const nameToId = new Map(
        allConcepts.map((c) => [c.name.toLowerCase(), c.id])
      );

      lessons = aiResult.lessons.map((l, i) => ({
        id: `lesson-${i + 1}`,
        title: l.title,
        description: l.description,
        conceptIds: l.conceptNames
          .map((n) => nameToId.get(n.toLowerCase()))
          .filter(Boolean) as string[],
        estimatedMinutes: l.estimatedMinutes || l.conceptNames.length * 5,
        difficulty: l.difficulty || 1,
        order: i,
      }));
    } else {
      throw new Error("Empty AI response");
    }
  } catch {
    // Fallback to heuristic grouping
    lessons = groupIntoLessons(ordered);
  }

  // Cache in content metadata
  db.update(contents)
    .set({ metadata: { ...metadata, learningPath: lessons } })
    .where(eq(contents.id, contentId))
    .run();

  return NextResponse.json({ lessons, cached: false });
}
