"use client";

import { useConceptsByContent } from "@/hooks/use-concepts";
import { useSubmitTeachBack } from "@/hooks/use-critical-thinking";
import { ScoreDisplay } from "./score-display";
import { GraduationCap } from "lucide-react";
import { useState } from "react";

export function TeachBackSession({ contentId }: { contentId: string }) {
  const { data, isLoading } = useConceptsByContent(contentId);
  const submitMutation = useSubmitTeachBack();
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<{
    scores: {
      accuracy: number;
      completeness: number;
      reasoning: number;
      criticalThinking: number;
      overall: number;
    };
    feedback: string;
    xpEarned: number;
  } | null>(null);

  const concepts = data?.concepts || [];
  const selectedConcept = concepts.find(
    (c: { id: string }) => c.id === selectedConceptId
  );

  if (result) {
    return (
      <ScoreDisplay
        scores={[
          { label: "Accuracy", score: result.scores.accuracy },
          { label: "Completeness", score: result.scores.completeness },
          { label: "Clarity & Reasoning", score: result.scores.reasoning },
          {
            label: "Critical Thinking",
            score: result.scores.criticalThinking,
          },
        ]}
        feedback={result.feedback}
        xpEarned={result.xpEarned}
        onDone={() => {
          setResult(null);
          setExplanation("");
          setSelectedConceptId("");
        }}
      />
    );
  }

  const handleSubmit = async () => {
    if (!selectedConceptId || !explanation.trim()) return;

    const res = await submitMutation.mutateAsync({
      contentId,
      conceptId: selectedConceptId,
      userExplanation: explanation.trim(),
    });

    setResult(res);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <GraduationCap className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Teach-Back</h3>
            <p className="text-sm text-text-secondary">
              Explain a concept as if teaching someone unfamiliar with it
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Concept selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Select a concept to teach
            </label>
            {isLoading ? (
              <p className="text-sm text-text-secondary">
                Loading concepts...
              </p>
            ) : (
              <select
                value={selectedConceptId}
                onChange={(e) => setSelectedConceptId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Choose a concept...</option>
                {concepts.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Show concept name when selected */}
          {selectedConcept && (
            <div className="rounded-lg bg-background p-3">
              <p className="text-xs font-medium text-primary">
                Teaching: {(selectedConcept as { name: string }).name}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Write your explanation below as if you&apos;re teaching this to
                someone who has never heard of it. Use examples and analogies
                when possible.
              </p>
            </div>
          )}

          {/* Explanation textarea */}
          <div>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the concept in your own words..."
              rows={8}
              disabled={!selectedConceptId}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none disabled:opacity-50"
            />
            <p className="mt-1 text-right text-xs text-text-secondary">
              {explanation.length} characters
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              !selectedConceptId ||
              explanation.trim().length < 50 ||
              submitMutation.isPending
            }
            className="w-full rounded-lg bg-success px-4 py-2.5 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-50"
          >
            {submitMutation.isPending
              ? "Evaluating..."
              : "Submit Explanation"}
          </button>

          {explanation.trim().length > 0 && explanation.trim().length < 50 && (
            <p className="text-center text-xs text-text-secondary">
              Write at least 50 characters for a meaningful evaluation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
