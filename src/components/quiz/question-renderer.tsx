"use client";

import { cn } from "@/lib/utils/cn";
import { useState, useEffect } from "react";

interface Question {
  id: string;
  questionType: string;
  questionText: string;
  options: string[] | null;
  difficultyLevel: number | null;
  bloomsLevel: string | null;
  points: number | null;
  timeLimitSeconds: number | null;
}

export function QuestionRenderer({
  question,
  onAnswer,
  selectedAnswer,
  showFeedback,
}: {
  question: Question;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  showFeedback: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  // Keyboard shortcuts for answering
  useEffect(() => {
    if (selectedAnswer) return; // Already answered

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toUpperCase();

      // MCQ: A/B/C/D or 1/2/3/4
      if (question.questionType === "mcq" && question.options) {
        const letterIndex = "ABCD".indexOf(key);
        const numberIndex = "1234".indexOf(e.key);
        const idx = letterIndex >= 0 ? letterIndex : numberIndex;
        if (idx >= 0 && idx < question.options.length) {
          e.preventDefault();
          onAnswer(question.options[idx]);
        }
      }

      // True/False: T or F
      if (question.questionType === "true_false") {
        if (key === "T") { e.preventDefault(); onAnswer("True"); }
        if (key === "F") { e.preventDefault(); onAnswer("False"); }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, selectedAnswer, onAnswer]);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      {/* Meta */}
      <div className="mb-4 flex gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
          {question.questionType.replace("_", " ")}
        </span>
        <span className="rounded-full bg-background px-2.5 py-0.5 text-xs text-text-secondary">
          {question.points} pts
        </span>
      </div>

      {/* Question text */}
      <h3 className="mb-6 text-lg font-medium text-text-primary">
        {question.questionText}
      </h3>

      {/* Answer area by type */}
      {(question.questionType === "mcq" && question.options) && (
        <div className="space-y-2">
          {(question.options as string[]).map((option, i) => (
            <button
              key={i}
              onClick={() => onAnswer(option)}
              disabled={!!selectedAnswer}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors",
                selectedAnswer === option
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-primary hover:bg-surface-hover",
                selectedAnswer && selectedAnswer !== option && "opacity-60"
              )}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-current text-xs font-medium">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          ))}
        </div>
      )}

      {question.questionType === "true_false" && (
        <div className="flex gap-4">
          {["True", "False"].map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              disabled={!!selectedAnswer}
              className={cn(
                "flex-1 rounded-lg border p-4 text-center text-sm font-medium transition-colors",
                selectedAnswer === opt
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-primary hover:bg-surface-hover",
                selectedAnswer && selectedAnswer !== opt && "opacity-60"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(question.questionType === "fill_blank" ||
        question.questionType === "short_answer") && (
        <div className="space-y-3">
          {question.questionType === "short_answer" ? (
            <textarea
              value={selectedAnswer || inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!!selectedAnswer}
              placeholder="Type your answer..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <input
              type="text"
              value={selectedAnswer || inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!!selectedAnswer}
              placeholder="Fill in the blank..."
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
          {!selectedAnswer && (
            <button
              onClick={() => onAnswer(inputValue)}
              disabled={!inputValue.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              Submit Answer
            </button>
          )}
        </div>
      )}

      {/* Feedback overlay */}
      {showFeedback && selectedAnswer && (
        <div className="mt-4 rounded-lg bg-primary/5 p-3 text-sm text-text-secondary">
          Answer recorded. Moving to next question...
        </div>
      )}
    </div>
  );
}
