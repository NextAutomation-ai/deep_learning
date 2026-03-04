import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { verifyContentOwnership } from "@/lib/auth/verify-content-owner";
import { db } from "@/lib/db";
import { conceptRelationships, concepts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const session = await getUser();
  const { contentId } = await params;

  if (!verifyContentOwnership(contentId, session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relationships = db
    .select()
    .from(conceptRelationships)
    .where(eq(conceptRelationships.contentId, contentId))
    .all();

  // Get concept names for display
  const allConcepts = db
    .select({ id: concepts.id, name: concepts.name })
    .from(concepts)
    .where(eq(concepts.contentId, contentId))
    .all();

  const nameMap = new Map(allConcepts.map((c) => [c.id, c.name]));

  const enriched = relationships.map((r) => ({
    ...r,
    sourceConceptName: nameMap.get(r.sourceConceptId) || "Unknown",
    targetConceptName: nameMap.get(r.targetConceptId) || "Unknown",
  }));

  return NextResponse.json({ relationships: enriched });
}
