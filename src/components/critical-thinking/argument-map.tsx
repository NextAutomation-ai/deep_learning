"use client";

import { useArguments, useAddCounterArgument } from "@/hooks/use-critical-thinking";
import { ArgumentDetailPanel } from "./argument-detail-panel";
import { cn } from "@/lib/utils/cn";
import { GitBranch, ChevronDown, ChevronRight } from "lucide-react";
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

export function ArgumentMap({ contentId }: { contentId: string }) {
  const { data, isLoading } = useArguments(contentId);
  const [selectedArgId, setSelectedArgId] = useState<string | null>(null);
  const [expandedArgs, setExpandedArgs] = useState<Set<string>>(new Set());

  const args: Argument[] = data?.arguments || [];

  const toggleExpand = (id: string) => {
    setExpandedArgs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedArg = args.find((a) => a.id === selectedArgId);

  if (isLoading) {
    return (
      <p className="text-center text-text-secondary">Loading arguments...</p>
    );
  }

  if (args.length === 0) {
    return (
      <div className="py-12 text-center">
        <GitBranch className="mx-auto mb-3 h-12 w-12 text-text-secondary/40" />
        <p className="text-text-secondary">No arguments extracted yet.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Arguments are extracted during content processing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Argument List */}
      <div className={cn("space-y-3", selectedArgId ? "w-1/2" : "w-full")}>
        <h3 className="font-semibold text-text-primary">
          Arguments ({args.length})
        </h3>

        {args.map((arg) => {
          const isExpanded = expandedArgs.has(arg.id);
          const strength = arg.strengthScore ?? 0.5;
          const strengthColor =
            strength >= 0.7
              ? "bg-success"
              : strength >= 0.4
                ? "bg-warning"
                : "bg-danger";

          return (
            <div
              key={arg.id}
              className={cn(
                "rounded-xl border bg-surface transition-all",
                selectedArgId === arg.id
                  ? "border-primary"
                  : "border-border hover:border-primary/30"
              )}
            >
              {/* Thesis header */}
              <button
                onClick={() => toggleExpand(arg.id)}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <div
                  className={cn("mt-1 h-3 w-3 flex-shrink-0 rounded-full", strengthColor)}
                  title={`Strength: ${Math.round(strength * 100)}%`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {arg.thesis}
                  </p>
                  {arg.logicalStructure && (
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                      {arg.logicalStructure}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-3">
                  {/* Premises */}
                  {arg.premises && arg.premises.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-text-secondary">
                        Premises
                      </p>
                      <ul className="space-y-1">
                        {arg.premises.map((p, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-text-primary"
                          >
                            <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Evidence */}
                  {arg.evidence && arg.evidence.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-text-secondary">
                        Evidence
                      </p>
                      <ul className="space-y-1">
                        {arg.evidence.map((e, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-text-primary"
                          >
                            <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fallacies */}
                  {arg.fallacies && arg.fallacies.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-danger">
                        Fallacies Detected
                      </p>
                      <ul className="space-y-1">
                        {arg.fallacies.map((f, i) => (
                          <li
                            key={i}
                            className="text-xs text-danger"
                          >
                            ⚠ {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedArgId(arg.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover"
                  >
                    View Details & Add Counter-Arguments
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedArg && (
        <ArgumentDetailPanel
          argument={selectedArg}
          contentId={contentId}
          onClose={() => setSelectedArgId(null)}
        />
      )}
    </div>
  );
}
