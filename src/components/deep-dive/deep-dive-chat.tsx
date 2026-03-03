"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageSquare,
  Lightbulb,
  GitCompareArrows,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDeepDiveStore, type DeepDiveMode } from "@/stores/deep-dive-store";
import { useDeepDiveAsk, useWhatIfAsk, useCompareConcepts } from "@/hooks/use-deep-dive";
import { useConceptsByContent } from "@/hooks/use-concepts";
import { toastError } from "@/hooks/use-toast";

const modes: { value: DeepDiveMode; label: string; icon: typeof MessageSquare }[] = [
  { value: "qa", label: "Q&A", icon: MessageSquare },
  { value: "whatif", label: "What If", icon: Lightbulb },
  { value: "compare", label: "Compare", icon: GitCompareArrows },
];

interface DeepDiveChatProps {
  contentId: string;
}

export function DeepDiveChat({ contentId }: DeepDiveChatProps) {
  const store = useDeepDiveStore();
  const askMutation = useDeepDiveAsk(contentId);
  const whatIfMutation = useWhatIfAsk(contentId);
  const compareMutation = useCompareConcepts(contentId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch concepts for suggestions and compare mode
  const { data: conceptsData } = useConceptsByContent(contentId);
  const concepts: Array<{ id: string; name: string; definition: string }> =
    Array.isArray(conceptsData?.concepts) ? conceptsData.concepts : [];
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [store.messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setInput("");
    store.addMessage("user", text);

    try {
      if (store.mode === "qa") {
        const res = await askMutation.mutateAsync({
          question: text,
          conversationHistory: store.messages,
        });
        store.addMessage("ai", res.answer);
      } else if (store.mode === "whatif") {
        const res = await whatIfMutation.mutateAsync({
          scenario: text,
          conversationHistory: store.messages,
        });
        store.addMessage("ai", res.response);
      }
    } catch {
      toastError("Error", "Failed to get a response. Please try again.");
    }
  };

  const handleCompare = async () => {
    if (!compareA || !compareB || compareA === compareB) return;
    try {
      const res = await compareMutation.mutateAsync({
        conceptIdA: compareA,
        conceptIdB: compareB,
      });
      store.setCompareResult(res);
    } catch {
      toastError("Error", "Failed to compare concepts.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isPending = askMutation.isPending || whatIfMutation.isPending;

  // Starter suggestions
  const suggestions =
    store.mode === "qa"
      ? concepts.slice(0, 3).map((c) => `Explain "${c.name}" in more detail`)
      : concepts.slice(0, 3).map((c) => `What if "${c.name}" didn't exist?`);

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.value}
              onClick={() => store.setMode(m.value)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                store.mode === m.value
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-secondary hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Compare mode */}
      {store.mode === "compare" ? (
        <ComparePanel
          concepts={concepts}
          compareA={compareA}
          compareB={compareB}
          setCompareA={setCompareA}
          setCompareB={setCompareB}
          onCompare={handleCompare}
          isPending={compareMutation.isPending}
          result={store.compareResult}
        />
      ) : (
        /* Chat mode (Q&A and What-If) */
        <div className="flex h-[550px] flex-col rounded-xl border border-border bg-surface">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4">
            {store.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  {store.mode === "qa" ? (
                    <MessageSquare className="h-7 w-7 text-primary" />
                  ) : (
                    <Lightbulb className="h-7 w-7 text-warning" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {store.mode === "qa"
                      ? "Ask anything about this content"
                      : "Explore hypothetical scenarios"}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {store.mode === "qa"
                      ? "AI will answer grounded in the source material."
                      : "What if things were different? Explore the consequences."}
                  </p>
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text-secondary hover:border-primary/40 hover:text-text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {store.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "bg-background text-text-primary"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isPending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm text-text-secondary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  store.mode === "qa"
                    ? "Ask a question about this content..."
                    : "What if..."
                }
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isPending}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparePanel({
  concepts,
  compareA,
  compareB,
  setCompareA,
  setCompareB,
  onCompare,
  isPending,
  result,
}: {
  concepts: Array<{ id: string; name: string; definition: string }>;
  compareA: string;
  compareB: string;
  setCompareA: (id: string) => void;
  setCompareB: (id: string) => void;
  onCompare: () => void;
  isPending: boolean;
  result: { similarities: string[]; differences: string[]; relationship: string; insight: string } | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Concept A
          </label>
          <select
            value={compareA}
            onChange={(e) => setCompareA(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">Select a concept...</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Concept B
          </label>
          <select
            value={compareB}
            onChange={(e) => setCompareB(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">Select a concept...</option>
            {concepts
              .filter((c) => c.id !== compareA)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <button
        onClick={onCompare}
        disabled={!compareA || !compareB || compareA === compareB || isPending}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Comparing..." : "Compare"}
      </button>

      {result && (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-text-primary">
              Similarities
            </h4>
            <ul className="space-y-1">
              {result.similarities.map((s, i) => (
                <li key={i} className="text-sm text-text-secondary">
                  &bull; {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-text-primary">
              Differences
            </h4>
            <ul className="space-y-1">
              {result.differences.map((d, i) => (
                <li key={i} className="text-sm text-text-secondary">
                  &bull; {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-text-primary">
              Relationship
            </h4>
            <p className="text-sm text-text-secondary">{result.relationship}</p>
          </div>
          <div className="rounded-lg bg-primary/5 p-3">
            <h4 className="mb-1 text-sm font-semibold text-primary">
              Key Insight
            </h4>
            <p className="text-sm text-text-primary">{result.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}
