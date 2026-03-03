"use client";

import { useConcept, useExplainConcept } from "@/hooks/use-concepts";
import { useMindmapStore } from "@/stores/mindmap-store";
import { X, BookOpen, Lightbulb, ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";

export function ConceptSidePanel({ conceptId }: { conceptId: string }) {
  const { data, isLoading } = useConcept(conceptId);
  const selectNode = useMindmapStore((s) => s.selectNode);
  const explainMutation = useExplainConcept();
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const handleExplain = async (mode: "simpler" | "deeper") => {
    const result = await explainMutation.mutateAsync({ conceptId, mode });
    setAiExplanation(result.explanation);
  };

  if (isLoading) {
    return (
      <div className="absolute right-0 top-0 z-20 h-full w-80 border-l border-border bg-surface p-6">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  const concept = data?.concept;
  if (!concept) return null;

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-96 flex-col border-l border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-lg font-semibold text-text-primary">{concept.name}</h3>
        <button
          onClick={() => selectNode(null)}
          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Type & Difficulty */}
        <div className="flex gap-2">
          {concept.conceptType && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {concept.conceptType}
            </span>
          )}
          {concept.bloomsLevel && (
            <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
              {concept.bloomsLevel}
            </span>
          )}
          <span className="rounded-full bg-background px-2.5 py-1 text-xs text-text-secondary">
            Level {concept.difficultyLevel}/5
          </span>
        </div>

        {/* Definition */}
        <div>
          <h4 className="mb-1 text-sm font-medium text-text-primary">Definition</h4>
          <p className="text-sm text-text-secondary">{concept.definition}</p>
        </div>

        {/* Detailed Explanation */}
        {concept.detailedExplanation && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-text-primary">Explanation</h4>
            <p className="text-sm text-text-secondary">{concept.detailedExplanation}</p>
          </div>
        )}

        {/* Source Excerpt */}
        {concept.sourceExcerpt && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-text-primary">Source</h4>
            <p className="rounded-lg bg-background p-3 text-sm italic text-text-secondary">
              &ldquo;{concept.sourceExcerpt}&rdquo;
            </p>
          </div>
        )}

        {/* AI Explanation */}
        {aiExplanation && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-text-primary">
              <Lightbulb className="mr-1 inline h-4 w-4 text-warning" />
              AI Explanation
            </h4>
            <div className="rounded-lg bg-primary/5 p-3 text-sm text-text-secondary">
              {aiExplanation}
            </div>
          </div>
        )}

        {/* Explain buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExplain("simpler")}
            disabled={explainMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Simpler
          </button>
          <button
            onClick={() => handleExplain("deeper")}
            disabled={explainMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Deeper
          </button>
        </div>

        {/* Related Concepts */}
        {data?.relatedConcepts?.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-text-primary">Related</h4>
            <div className="space-y-1">
              {data.relatedConcepts.map((rc: { id: string; name: string }) => (
                <button
                  key={rc.id}
                  onClick={() => selectNode(rc.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                >
                  <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                  {rc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
