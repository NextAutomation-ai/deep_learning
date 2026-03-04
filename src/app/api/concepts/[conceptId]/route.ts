import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { concepts, conceptRelationships } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conceptId: string }> }
) {
  const { conceptId } = await params;

  const concept = (await db
    .select()
    .from(concepts)
    .where(eq(concepts.id, conceptId))
    .limit(1))[0];

  if (!concept) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get related concepts
  const relationships = await db
    .select()
    .from(conceptRelationships)
    .where(
      or(
        eq(conceptRelationships.sourceConceptId, conceptId),
        eq(conceptRelationships.targetConceptId, conceptId)
      )
    );

  // Get names for related concepts
  const relatedIds = new Set<string>();
  for (const r of relationships) {
    if (r.sourceConceptId !== conceptId) relatedIds.add(r.sourceConceptId);
    if (r.targetConceptId !== conceptId) relatedIds.add(r.targetConceptId);
  }

  const relatedConcepts = relatedIds.size > 0
    ? (await db
        .select({ id: concepts.id, name: concepts.name, definition: concepts.definition })
        .from(concepts))
        .filter((c) => relatedIds.has(c.id))
    : [];

  return NextResponse.json({ concept, relationships, relatedConcepts });
}
