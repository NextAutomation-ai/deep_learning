import type { AIMessage } from "../types";

export function buildRelationshipMappingPrompt(
  concepts: { name: string; definition: string }[]
): AIMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert at understanding relationships between concepts.

Given a list of concepts, identify ALL meaningful relationships between them.

Relationship types:
- prerequisite: Understanding source is needed to understand target
- related: Concepts are closely related
- contradicts: Concepts oppose each other
- supports: Source provides evidence/support for target
- part_of: Source is a component/subset of target
- causes: Source leads to or causes target
- example_of: Source is an example of target
- opposite: Concepts are opposites

For each relationship provide:
- source: concept name (must match exactly from input)
- target: concept name (must match exactly from input)
- type: One of the relationship types above
- strength: 0.0-1.0 (1.0 = very strong relationship)
- description: Brief description of the relationship

Respond ONLY in valid JSON format:
{
  "relationships": [...]
}`,
    },
    {
      role: "user",
      content: `Identify relationships between these concepts:\n\n${JSON.stringify(concepts, null, 2)}`,
    },
  ];
}

export interface ExtractedRelationship {
  source: string;
  target: string;
  type: string;
  strength: number;
  description: string;
}
