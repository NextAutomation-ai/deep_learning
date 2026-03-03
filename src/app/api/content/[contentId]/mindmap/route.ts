import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { concepts, conceptRelationships, userProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
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

  const progressRows = db
    .select()
    .from(userProgress)
    .where(eq(userProgress.contentId, contentId))
    .all()
    .filter((p) => p.userId === session.user.id);

  const progressMap = new Map(progressRows.map((p) => [p.conceptId, p]));

  const nodes = allConcepts.map((c) => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    conceptType: c.conceptType,
    difficultyLevel: c.difficultyLevel,
    bloomsLevel: c.bloomsLevel,
    importanceScore: c.importanceScore,
    chunkId: c.chunkId,
    masteryLevel: progressMap.get(c.id)?.masteryLevel ?? 0,
  }));

  const links = relationships.map((r) => ({
    source: r.sourceConceptId,
    target: r.targetConceptId,
    relationshipType: r.relationshipType,
    strength: r.strength,
    description: r.description,
  }));

  return NextResponse.json({ nodes, links });
}
