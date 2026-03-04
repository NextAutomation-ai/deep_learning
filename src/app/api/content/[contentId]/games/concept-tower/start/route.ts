import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { concepts, contentChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { shuffle } from "@/lib/gamification/game-helpers";

interface TowerBlock {
  id: string;
  conceptName: string;
  definition: string;
  difficulty: number;
  question: string;
  answer: string;
  options: string[];
  correctIndex: number;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;

  if (!verifyContentOwnership(contentId, session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allConcepts = db
    .select()
    .from(concepts)
    .where(eq(concepts.contentId, contentId))
    .all();

  if (allConcepts.length < 5) {
    return NextResponse.json(
      { error: "Need at least 5 concepts to play Concept Tower" },
      { status: 400 }
    );
  }

  // Sort by difficulty and pick progressively harder questions
  const sorted = [...allConcepts].sort(
    (a, b) => (a.difficultyLevel ?? 1) - (b.difficultyLevel ?? 1)
  );

  // Build tower levels (up to 10)
  const numLevels = Math.min(10, sorted.length);
  const selected = sorted.slice(0, numLevels);

  const blocks: TowerBlock[] = selected.map((concept, idx) => {
    // Create a fill-in-the-blank style question from the definition
    const words = concept.definition.split(" ");
    const keyWordIdx = Math.min(
      Math.floor(words.length / 2),
      words.length - 1
    );
    const answer = concept.name;

    // Pick 3 distractors
    const others = allConcepts.filter((c) => c.id !== concept.id);
    const distractors = shuffle(others)
      .slice(0, 3)
      .map((c) => c.name);
    const options = shuffle([answer, ...distractors]);

    return {
      id: concept.id,
      conceptName: concept.name,
      definition: concept.definition,
      difficulty: idx + 1,
      question: `Which concept matches: "${concept.definition.slice(0, 100)}${concept.definition.length > 100 ? "..." : ""}"`,
      answer,
      options,
      correctIndex: options.indexOf(answer),
    };
  });

  return NextResponse.json({
    gameType: "concept_tower",
    blocks,
    totalLevels: blocks.length,
    livesTotal: 3,
  });
}
