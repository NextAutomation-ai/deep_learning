"use client";

import { useAddCounterArgument } from "@/hooks/use-critical-thinking";
import { cn } from "@/lib/utils/cn";
import { X, Plus } from "lucide-react";
import { useState } from "react";

interface Argument {
  id: string;
  thesis: string;
  premises: string[] | null;
  evidence: string[] | null;
  assumptions: string[] | null;
  fallacies: string[] | null;
  strengthScore: number | null;
  counterArguments: string[] | null;
  conclusion: string | null;
  logicalStructure: string | null;
}

export function ArgumentDetailPanel({
  argument,
  contentId,
  onClose,
}: {
  argument: Argument;
  contentId: string;
  onClose: () => void;
}) {
  const addCounterMutation = useAddCounterArgument();
  const [newCounter, setNewCounter] = useState("");

  const strength = argument.strengthScore ?? 0.5;

  const handleAddCounter = async () => {
    if (!newCounter.trim()) return;
    await addCounterMutation.mutateAsync({
      contentId,
      argumentId: argument.id,
      counterArgument: newCounter.trim(),
    });
    setNewCounter("");
  };

  return (
    <div className="w-1/2 space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text-primary">Argument Details</h4>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-secondary hover:bg-surface-hover"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Thesis */}
      <div>
        <p className="mb-1 text-xs font-medium text-text-secondary">Thesis</p>
        <p className="text-sm text-text-primary">{argument.thesis}</p>
      </div>

      {/* Strength */}
      <div>
        <p className="mb-1 text-xs font-medium text-text-secondary">
          Argument Strength
        </p>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-border">
            <div
              className={cn(
                "h-full rounded-full",
                strength >= 0.7
                  ? "bg-success"
                  : strength >= 0.4
                    ? "bg-warning"
                    : "bg-danger"
              )}
              style={{ width: `${strength * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary">
            {Math.round(strength * 100)}%
          </span>
        </div>
      </div>

      {/* Assumptions */}
      {argument.assumptions && argument.assumptions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary">
            Unstated Assumptions
          </p>
          <ul className="space-y-1">
            {argument.assumptions.map((a, i) => (
              <li key={i} className="text-xs text-text-primary">
                • {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conclusion */}
      {argument.conclusion && (
        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary">
            Conclusion
          </p>
          <p className="text-xs text-text-primary">{argument.conclusion}</p>
        </div>
      )}

      {/* Counter-Arguments */}
      <div>
        <p className="mb-1 text-xs font-medium text-text-secondary">
          Counter-Arguments
        </p>
        {argument.counterArguments && argument.counterArguments.length > 0 ? (
          <ul className="mb-2 space-y-1">
            {argument.counterArguments.map((c, i) => (
              <li key={i} className="text-xs text-text-primary">
                ↩ {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-2 text-xs text-text-secondary">
            No counter-arguments yet.
          </p>
        )}

        {/* Add counter-argument form */}
        <div className="flex gap-2">
          <input
            value={newCounter}
            onChange={(e) => setNewCounter(e.target.value)}
            placeholder="Add a counter-argument..."
            className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCounter();
            }}
          />
          <button
            onClick={handleAddCounter}
            disabled={!newCounter.trim() || addCounterMutation.isPending}
            className="rounded-lg bg-primary p-1.5 text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
