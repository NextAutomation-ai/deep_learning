"use client";

import { useArguments, useStartDebate } from "@/hooks/use-critical-thinking";
import { useCriticalThinkingStore } from "@/stores/critical-thinking-store";
import { Swords } from "lucide-react";
import { useState } from "react";

export function DevilsAdvocateStarter({ contentId }: { contentId: string }) {
  const { data } = useArguments(contentId);
  const startMutation = useStartDebate();
  const { startDebate, steelManMode, toggleSteelMan } =
    useCriticalThinkingStore();
  const [selectedArgId, setSelectedArgId] = useState("");
  const [customClaim, setCustomClaim] = useState("");

  const args = data?.arguments || [];
  const selectedArg = args.find(
    (a: { id: string }) => a.id === selectedArgId
  );

  const claim = selectedArg
    ? selectedArg.thesis
    : customClaim.trim();

  const handleStart = async () => {
    if (!claim) return;

    const result = await startMutation.mutateAsync({
      contentId,
      claim,
      argumentId: selectedArgId || undefined,
      steelManMode,
    });

    startDebate(
      result.debateId,
      claim,
      result.aiCounterArgument,
      result.steelManMode
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
            <Swords className="h-5 w-5 text-danger" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              Devil&apos;s Advocate
            </h3>
            <p className="text-sm text-text-secondary">
              Defend a claim against AI counter-arguments
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pick from existing arguments */}
          {args.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Select a claim from content
              </label>
              <select
                value={selectedArgId}
                onChange={(e) => {
                  setSelectedArgId(e.target.value);
                  if (e.target.value) setCustomClaim("");
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Or type a custom claim below</option>
                {args.map((a: { id: string; thesis: string }) => (
                  <option key={a.id} value={a.id}>
                    {a.thesis.length > 80
                      ? a.thesis.slice(0, 80) + "..."
                      : a.thesis}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom claim */}
          {!selectedArgId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                {args.length > 0 ? "Or enter a custom claim" : "Enter a claim to defend"}
              </label>
              <textarea
                value={customClaim}
                onChange={(e) => setCustomClaim(e.target.value)}
                placeholder="e.g., 'Machine learning will replace most programming jobs within 10 years'"
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {/* Steel Man toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-background p-3">
            <input
              type="checkbox"
              checked={steelManMode}
              onChange={toggleSteelMan}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Steel Man Mode
              </p>
              <p className="text-xs text-text-secondary">
                AI presents the strongest possible counter-argument
              </p>
            </div>
          </label>

          <button
            onClick={handleStart}
            disabled={!claim || startMutation.isPending}
            className="w-full rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
          >
            {startMutation.isPending ? "Starting debate..." : "Start Debate"}
          </button>
        </div>
      </div>
    </div>
  );
}
