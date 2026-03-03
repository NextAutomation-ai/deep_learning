// Topological sort for concept learning order

interface ConceptNode {
  id: string;
  name: string;
  difficultyLevel: number;
  importanceScore: number | null;
}

interface Relationship {
  sourceConceptId: string;
  targetConceptId: string;
  relationshipType: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  conceptIds: string[];
  estimatedMinutes: number;
  difficulty: number;
  order: number;
}

/**
 * Orders concepts by prerequisite dependencies using Kahn's algorithm.
 * Ties broken by: difficulty ascending, then importance descending.
 */
export function topologicalSort(
  concepts: ConceptNode[],
  relationships: Relationship[]
): ConceptNode[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const c of concepts) {
    graph.set(c.id, []);
    inDegree.set(c.id, 0);
  }

  const prereqs = relationships.filter(
    (r) => r.relationshipType === "prerequisite"
  );
  for (const r of prereqs) {
    if (graph.has(r.sourceConceptId) && inDegree.has(r.targetConceptId)) {
      graph.get(r.sourceConceptId)!.push(r.targetConceptId);
      inDegree.set(r.targetConceptId, inDegree.get(r.targetConceptId)! + 1);
    }
  }

  // Seed queue with nodes that have no prerequisites
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const conceptMap = new Map(concepts.map((c) => [c.id, c]));
  const sorted: ConceptNode[] = [];

  while (queue.length > 0) {
    // Among available, sort by difficulty asc, importance desc
    queue.sort((a, b) => {
      const ca = conceptMap.get(a)!;
      const cb = conceptMap.get(b)!;
      if (ca.difficultyLevel !== cb.difficultyLevel)
        return ca.difficultyLevel - cb.difficultyLevel;
      return (cb.importanceScore ?? 0) - (ca.importanceScore ?? 0);
    });

    const current = queue.shift()!;
    sorted.push(conceptMap.get(current)!);

    for (const neighbor of graph.get(current) || []) {
      const newDeg = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Handle cycles: append remaining sorted by difficulty
  const sortedIds = new Set(sorted.map((c) => c.id));
  const remaining = concepts
    .filter((c) => !sortedIds.has(c.id))
    .sort((a, b) => a.difficultyLevel - b.difficultyLevel);

  return [...sorted, ...remaining];
}

/**
 * Groups ordered concepts into lessons of 3-7 concepts each.
 * Simple heuristic grouping (used as fallback if AI grouping fails).
 */
export function groupIntoLessons(
  orderedConcepts: ConceptNode[],
  targetSize: number = 5
): Lesson[] {
  const lessons: Lesson[] = [];
  let i = 0;

  while (i < orderedConcepts.length) {
    const size = Math.min(targetSize, orderedConcepts.length - i);
    const group = orderedConcepts.slice(i, i + size);
    const avgDifficulty =
      group.reduce((sum, c) => sum + c.difficultyLevel, 0) / group.length;

    lessons.push({
      id: `lesson-${lessons.length + 1}`,
      title: `Lesson ${lessons.length + 1}`,
      description: `Covers: ${group.map((c) => c.name).join(", ")}`,
      conceptIds: group.map((c) => c.id),
      estimatedMinutes: group.length * 5,
      difficulty: Math.round(avgDifficulty),
      order: lessons.length,
    });

    i += size;
  }

  return lessons;
}
