"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useExplainConcept } from "@/hooks/use-concepts";
import { useState } from "react";

interface Concept {
  id: string;
  name: string;
  definition: string;
  detailedExplanation: string | null;
  sourceExcerpt: string | null;
  conceptType: string | null;
  bloomsLevel: string | null;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: number;
  conceptIds: string[];
}

export function LessonViewer({
  lesson,
  concepts,
  contentId,
  onBack,
  onComplete,
}: {
  lesson: Lesson;
  concepts: Concept[];
  contentId: string;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const explainMutation = useExplainConcept();
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});

  const currentConcept = concepts[currentConceptIndex];
  const isLast = currentConceptIndex === concepts.length - 1;

  const handleExplain = async (mode: "simpler" | "deeper") => {
    if (!currentConcept) return;
    const result = await explainMutation.mutateAsync({
      conceptId: currentConcept.id,
      mode,
    });
    setAiExplanations((prev) => ({
      ...prev,
      [`${currentConcept.id}-${mode}`]: result.explanation,
    }));
  };

  if (!currentConcept) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No concepts in this lesson.</p>
        <button onClick={onBack} className="mt-4 text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-text-primary">{lesson.title}</h2>
          <p className="text-sm text-text-secondary">
            Concept {currentConceptIndex + 1} of {concepts.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${((currentConceptIndex + 1) / concepts.length) * 100}%`,
          }}
        />
      </div>

      {/* Concept Card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex gap-2">
          {currentConcept.conceptType && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
              {currentConcept.conceptType}
            </span>
          )}
          {currentConcept.bloomsLevel && (
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs text-secondary">
              {currentConcept.bloomsLevel}
            </span>
          )}
        </div>

        <h3 className="mb-3 text-xl font-semibold text-text-primary">
          {currentConcept.name}
        </h3>

        <p className="text-text-secondary">{currentConcept.definition}</p>

        {currentConcept.detailedExplanation && (
          <div className="mt-4 rounded-lg bg-background p-4">
            <p className="text-sm text-text-secondary">
              {currentConcept.detailedExplanation}
            </p>
          </div>
        )}

        {currentConcept.sourceExcerpt && (
          <div className="mt-4 border-l-2 border-primary/30 pl-4">
            <p className="text-sm italic text-text-secondary">
              &ldquo;{currentConcept.sourceExcerpt}&rdquo;
            </p>
          </div>
        )}

        {/* AI explanations */}
        {Object.entries(aiExplanations)
          .filter(([key]) => key.startsWith(currentConcept.id))
          .map(([key, text]) => (
            <div key={key} className="mt-4 rounded-lg bg-primary/5 p-4">
              <p className="mb-1 text-xs font-medium text-primary">
                {key.endsWith("simpler") ? "Simplified" : "In-Depth"} Explanation
              </p>
              <p className="text-sm text-text-secondary">{text}</p>
            </div>
          ))}

        {/* Explain buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => handleExplain("simpler")}
            disabled={explainMutation.isPending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            Explain Simpler
          </button>
          <button
            onClick={() => handleExplain("deeper")}
            disabled={explainMutation.isPending}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover disabled:opacity-50"
          >
            Go Deeper
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentConceptIndex((i) => Math.max(0, i - 1))}
          disabled={currentConceptIndex === 0}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover disabled:opacity-30"
        >
          Previous
        </button>

        {isLast ? (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 rounded-lg bg-success px-6 py-2 text-sm font-medium text-white hover:bg-success/90"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete Lesson
          </button>
        ) : (
          <button
            onClick={() => setCurrentConceptIndex((i) => i + 1)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Next Concept
          </button>
        )}
      </div>
    </div>
  );
}
