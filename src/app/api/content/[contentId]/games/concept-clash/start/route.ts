import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { concepts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { shuffle } from "@/lib/gamification/game-helpers";

interface ClashQuestion {
  id: string;
  conceptName: string;
  definition: string;
  options: string[];
  correctIndex: number;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  await getUser();
  const { contentId } = await params;

  const allConcepts = db
    .select()
    .from(concepts)
    .where(eq(concepts.contentId, contentId))
    .all();

  if (allConcepts.length < 4) {
    return NextResponse.json(
      { error: "Need at least 4 concepts to play Concept Clash" },
      { status: 400 }
    );
  }

  // Build 10 questions (or fewer if not enough concepts)
  const numQuestions = Math.min(10, allConcepts.length);
  const selected = shuffle(allConcepts).slice(0, numQuestions);

  const questions: ClashQuestion[] = selected.map((concept) => {
    // Pick 3 wrong definitions from other concepts
    const others = allConcepts.filter((c) => c.id !== concept.id);
    const distractors = shuffle(others).slice(0, 3);

    const options = shuffle([
      concept.definition,
      ...distractors.map((d) => d.definition),
    ]);

    return {
      id: concept.id,
      conceptName: concept.name,
      definition: concept.definition,
      options,
      correctIndex: options.indexOf(concept.definition),
    };
  });

  return NextResponse.json({
    gameType: "concept_clash",
    questions,
    totalQuestions: questions.length,
    timePerQuestion: 15,
  });
}
