"use client";

import { useConceptsByContent } from "@/hooks/use-concepts";
import { useStartSocratic } from "@/hooks/use-critical-thinking";
import { useCriticalThinkingStore } from "@/stores/critical-thinking-store";
import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";

export function SocraticStarter({ contentId }: { contentId: string }) {
  const { data, isLoading } = useConceptsByContent(contentId);
  const startMutation = useStartSocratic();
  const { startSocratic } = useCriticalThinkingStore();
  const [selectedConceptId, setSelectedConceptId] = useState("");

  const concepts = data?.concepts || [];

  const handleStart = async () => {
    const result = await startMutation.mutateAsync({
      contentId,
      conceptId: selectedConceptId || undefined,
    });
    startSocratic(result.sessionId, result.conceptName, result.firstQuestion);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              Socratic Questioning
            </h3>
            <p className="text-sm text-text-secondary">
              Engage in guided inquiry to deepen your understanding
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">
              Select a concept to explore
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
                <option value="">Random concept</option>
                {concepts.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="rounded-lg bg-background p-3">
            <p className="text-xs text-text-secondary">
              The AI will ask probing questions about the concept. Respond
              thoughtfully — your answers are evaluated on depth of reasoning,
              evidence usage, consideration of alternatives, and logical
              coherence.
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {startMutation.isPending
              ? "Starting session..."
              : "Start Socratic Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
