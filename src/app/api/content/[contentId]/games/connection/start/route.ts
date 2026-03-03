import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { concepts, conceptRelationships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { shuffle } from "@/lib/gamification/game-helpers";

interface ConnectionPair {
  id: string;
  conceptName: string;
  relatedName: string;
  relationshipType: string;
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

  const relationships = db
    .select()
    .from(conceptRelationships)
    .where(eq(conceptRelationships.contentId, contentId))
    .all();

  if (relationships.length < 4) {
    return NextResponse.json(
      { error: "Need at least 4 concept relationships to play Connection Game" },
      { status: 400 }
    );
  }

  const conceptMap = new Map(allConcepts.map((c) => [c.id, c]));

  // Build valid pairs from relationships
  const validPairs: ConnectionPair[] = [];
  for (const rel of relationships) {
    const source = conceptMap.get(rel.sourceConceptId);
    const target = conceptMap.get(rel.targetConceptId);
    if (source && target) {
      validPairs.push({
        id: rel.id,
        conceptName: source.name,
        relatedName: target.name,
        relationshipType: rel.relationshipType || "related",
      });
    }
  }

  // Select 6 pairs (or fewer)
  const numPairs = Math.min(6, validPairs.length);
  const selected = shuffle(validPairs).slice(0, numPairs);

  // Create shuffled left and right columns
  const leftColumn = shuffle(selected.map((p) => ({ id: p.id, name: p.conceptName })));
  const rightColumn = shuffle(selected.map((p) => ({ id: p.id, name: p.relatedName })));

  return NextResponse.json({
    gameType: "connection",
    pairs: selected,
    leftColumn,
    rightColumn,
    totalPairs: selected.length,
    timeLimitSeconds: 120,
  });
}
