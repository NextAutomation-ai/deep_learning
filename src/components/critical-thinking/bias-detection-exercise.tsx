"use client";

import {
  useStartBiasExercise,
  useSubmitBiasExercise,
} from "@/hooks/use-critical-thinking";
import { useCriticalThinkingStore } from "@/stores/critical-thinking-store";
import { ScoreDisplay } from "./score-display";
import { ScanSearch } from "lucide-react";

export function BiasDetectionExercise({ contentId }: { contentId: string }) {
  const startMutation = useStartBiasExercise();
  const submitMutation = useSubmitBiasExercise();
  const {
    biasExerciseId,
    biasPassage,
    biasQuestions,
    biasResponses,
    biasScores,
    biasFeedback,
    biasXp,
    startBiasExercise,
    setBiasResponse,
    completeBias,
    reset,
    setActiveModule,
  } = useCriticalThinkingStore();

  // Score display
  if (biasScores && biasFeedback !== null) {
    return (
      <ScoreDisplay
        scores={[
          { label: "Perspective Awareness", score: biasScores.perspective },
          {
            label: "Fact vs Opinion Distinction",
            score: biasScores.factOpinion,
          },
          { label: "Bias Identification", score: biasScores.biasIdentification },
        ]}
        feedback={biasFeedback}
        xpEarned={biasXp}
        onDone={() => {
          reset();
          setActiveModule(null);
        }}
      />
    );
  }

  // Start screen
  if (!biasExerciseId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <ScanSearch className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                Bias Detection
              </h3>
              <p className="text-sm text-text-secondary">
                Analyze a passage for hidden biases and perspectives
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-background p-3">
            <p className="text-xs text-text-secondary">
              A random passage from the content will be selected. You&apos;ll
              answer 5 guided questions about perspective, bias, and critical
              analysis. Your responses are evaluated by AI.
            </p>
          </div>

          <button
            onClick={async () => {
              const result = await startMutation.mutateAsync({ contentId });
              startBiasExercise(
                result.exerciseId,
                result.passage,
                result.questions
              );
            }}
            disabled={startMutation.isPending}
            className="mt-4 w-full rounded-lg bg-warning px-4 py-2.5 text-sm font-medium text-white hover:bg-warning/90 disabled:opacity-50"
          >
            {startMutation.isPending
              ? "Preparing exercise..."
              : "Start Exercise"}
          </button>
        </div>
      </div>
    );
  }

  // Exercise form
  const allAnswered = biasResponses.every((r) => r.trim().length > 0);

  const handleSubmit = async () => {
    if (!biasExerciseId || !allAnswered) return;

    const responses = biasQuestions.map((q, i) => ({
      question: q,
      answer: biasResponses[i],
    }));

    const result = await submitMutation.mutateAsync({
      contentId,
      exerciseId: biasExerciseId,
      responses,
    });

    completeBias(result.scores, result.feedback, result.xpEarned);
  };

  return (
    <div className="space-y-6">
      {/* Passage */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs font-medium text-text-secondary">
          Passage to Analyze
        </p>
        <p className="text-sm leading-relaxed text-text-primary">
          {biasPassage}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {biasQuestions.map((question, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="mb-2 text-sm font-medium text-text-primary">
              {i + 1}. {question}
            </p>
            <textarea
              value={biasResponses[i]}
              onChange={(e) => setBiasResponse(i, e.target.value)}
              placeholder="Your analysis..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitMutation.isPending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {submitMutation.isPending ? "Evaluating..." : "Submit Answers"}
      </button>
    </div>
  );
}
