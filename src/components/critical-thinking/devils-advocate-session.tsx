"use client";

import { useDebateRespond } from "@/hooks/use-critical-thinking";
import { useCriticalThinkingStore } from "@/stores/critical-thinking-store";
import { ScoreDisplay } from "./score-display";
import { cn } from "@/lib/utils/cn";
import { Send, Flag, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function DevilsAdvocateSession({ contentId }: { contentId: string }) {
  const {
    debateId,
    debateClaim,
    steelManMode,
    debateMessages,
    debateScores,
    debateFeedback,
    debateXp,
    addDebateMessage,
    completeDebate,
    reset,
    setActiveModule,
  } = useCriticalThinkingStore();

  const respondMutation = useDebateRespond();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userMessageCount = debateMessages.filter(
    (m) => m.role === "user"
  ).length;
  const canComplete = userMessageCount >= 2;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debateMessages]);

  if (debateScores && debateFeedback !== null) {
    return (
      <ScoreDisplay
        scores={[
          { label: "Logical Reasoning", score: debateScores.reasoning },
          { label: "Evidence Usage", score: debateScores.evidence },
          {
            label: "Addressing Counter-Points",
            score: debateScores.counterPoints,
          },
        ]}
        feedback={debateFeedback}
        xpEarned={debateXp}
        onDone={() => {
          reset();
          setActiveModule(null);
        }}
      />
    );
  }

  const handleSend = async () => {
    if (!input.trim() || !debateId) return;

    const userMessage = input.trim();
    setInput("");
    addDebateMessage("user", userMessage);

    const result = await respondMutation.mutateAsync({
      contentId,
      debateId,
      message: userMessage,
    });

    if (result.aiResponse) {
      addDebateMessage("ai", result.aiResponse);
    }
  };

  const handleComplete = async () => {
    if (!debateId) return;

    const result = await respondMutation.mutateAsync({
      contentId,
      debateId,
      action: "complete",
    });

    if (result.completed) {
      completeDebate(result.scores, result.feedback, result.xpEarned);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-text-primary">
            Devil&apos;s Advocate
          </h3>
          {steelManMode && (
            <span className="flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
              <Shield className="h-3 w-3" />
              Steel Man
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-secondary">
          Defending: &ldquo;{debateClaim}&rdquo;
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {debateMessages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5",
                msg.role === "user"
                  ? "bg-primary text-white"
                  : "bg-danger/10 text-text-primary"
              )}
            >
              {msg.role === "ai" && (
                <p className="mb-1 text-[10px] font-medium text-danger">
                  Devil&apos;s Advocate
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {respondMutation.isPending && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-danger/10 px-4 py-2.5">
              <p className="text-sm text-text-secondary">
                Preparing counter-argument...
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Defend your position..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSend}
              disabled={!input.trim() || respondMutation.isPending}
              className="rounded-lg bg-primary p-2.5 text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={respondMutation.isPending}
                className="rounded-lg bg-success p-2.5 text-white hover:bg-success/90 disabled:opacity-50"
                title="End debate"
              >
                <Flag className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
