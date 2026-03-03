"use client";

import { useSocraticRespond } from "@/hooks/use-critical-thinking";
import { useCriticalThinkingStore } from "@/stores/critical-thinking-store";
import { ScoreDisplay } from "./score-display";
import { cn } from "@/lib/utils/cn";
import { Send, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function SocraticSession({ contentId }: { contentId: string }) {
  const {
    socraticSessionId,
    socraticConceptName,
    socraticMessages,
    socraticScores,
    socraticFeedback,
    socraticXp,
    addSocraticMessage,
    completeSocratic,
    reset,
    setActiveModule,
  } = useCriticalThinkingStore();

  const respondMutation = useSocraticRespond();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userMessageCount = socraticMessages.filter(
    (m) => m.role === "user"
  ).length;
  const canComplete = userMessageCount >= 3;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [socraticMessages]);

  if (socraticScores && socraticFeedback !== null) {
    return (
      <ScoreDisplay
        scores={[
          { label: "Depth of Reasoning", score: socraticScores.depth },
          { label: "Evidence Usage", score: socraticScores.evidence },
          {
            label: "Consideration of Alternatives",
            score: socraticScores.alternatives,
          },
          { label: "Logical Coherence", score: socraticScores.coherence },
        ]}
        feedback={socraticFeedback}
        xpEarned={socraticXp}
        onDone={() => {
          reset();
          setActiveModule(null);
        }}
      />
    );
  }

  const handleSend = async () => {
    if (!input.trim() || !socraticSessionId) return;

    const userMessage = input.trim();
    setInput("");
    addSocraticMessage("user", userMessage);

    const result = await respondMutation.mutateAsync({
      contentId,
      sessionId: socraticSessionId,
      message: userMessage,
    });

    if (result.aiResponse) {
      addSocraticMessage("ai", result.aiResponse);
    }
  };

  const handleComplete = async () => {
    if (!socraticSessionId) return;

    const result = await respondMutation.mutateAsync({
      contentId,
      sessionId: socraticSessionId,
      action: "complete",
    });

    if (result.completed) {
      completeSocratic(result.scores, result.feedback, result.xpEarned);
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
        <h3 className="font-semibold text-text-primary">
          Socratic Session: {socraticConceptName}
        </h3>
        <p className="text-xs text-text-secondary">
          {userMessageCount} responses &middot;{" "}
          {canComplete ? "Ready to complete" : `${3 - userMessageCount} more to go`}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {socraticMessages.map((msg, i) => (
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
                  : "bg-background text-text-primary"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {respondMutation.isPending && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-background px-4 py-2.5">
              <p className="text-sm text-text-secondary">Thinking...</p>
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
            placeholder="Type your response..."
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
                title="Complete session"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
