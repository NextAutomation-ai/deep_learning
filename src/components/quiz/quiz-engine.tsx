"use client";

import { useQuizStore } from "@/stores/quiz-store";
import { useSubmitQuiz } from "@/hooks/use-quiz";
import { QuestionRenderer } from "./question-renderer";
import { QuizSummary } from "./quiz-summary";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils/cn";

export function QuizEngine({ contentId }: { contentId: string }) {
  const {
    quizId,
    mode,
    questions,
    currentIndex,
    answers,
    startedAt,
    showFeedback,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    setShowFeedback,
    resetQuiz,
  } = useQuizStore();

  const submitMutation = useSubmitQuiz();
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const isLast = currentIndex === questions.length - 1;
  const handleSubmitRef = useRef<(() => void) | null>(null);

  // Keyboard navigation for quizzes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (submitted) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) previousQuestion();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!isLast) nextQuestion();
      } else if (e.key === "Enter" && isLast && answers.length > 0) {
        e.preventDefault();
        handleSubmitRef.current?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isLast, submitted, answers.length, previousQuestion, nextQuestion]);

  // Timer for speed round
  useEffect(() => {
    if (mode !== "speed_round" || !currentQuestion || submitted) return;
    const limit = currentQuestion.timeLimitSeconds ?? 5;
    setTimeLeft(limit);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          // Auto-advance on timeout
          if (!currentAnswer) {
            answerQuestion({
              questionId: currentQuestion.id,
              userAnswer: "",
              timeTaken: limit,
            });
          }
          if (!isLast) {
            setTimeout(() => nextQuestion(), 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, mode, currentQuestion, submitted, isLast, currentAnswer, answerQuestion, nextQuestion]);

  const handleAnswer = useCallback(
    (answer: string) => {
      answerQuestion({
        questionId: currentQuestion.id,
        userAnswer: answer,
        timeTaken: 0,
      });
      // Show feedback briefly then auto-advance
      setShowFeedback(true, answer.toLowerCase() === (currentQuestion as unknown as { correctAnswer?: string }).correctAnswer?.toLowerCase());
      setTimeout(() => {
        if (!isLast) {
          nextQuestion();
        }
      }, 1200);
    },
    [currentQuestion, answerQuestion, setShowFeedback, isLast, nextQuestion]
  );

  const handleSubmit = useCallback(async () => {
    if (!quizId) return;
    const result = await submitMutation.mutateAsync({
      contentId,
      quizId,
      answers,
      mode: mode || "standard",
    });
    setResults(result);
    setSubmitted(true);
  }, [quizId, contentId, submitMutation, answers, mode]);

  // Keep ref in sync for keyboard handler
  handleSubmitRef.current = handleSubmit;

  if (!quizId || questions.length === 0) return null;

  if (submitted && results) {
    return <QuizSummary results={results} onClose={resetQuiz} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          Question {currentIndex + 1} of {questions.length}
        </span>
        {timeLeft !== null && mode === "speed_round" && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-bold",
              timeLeft <= 2 ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
            )}
          >
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      {currentQuestion && (
        <QuestionRenderer
          question={currentQuestion}
          onAnswer={handleAnswer}
          selectedAnswer={currentAnswer?.userAnswer}
          showFeedback={showFeedback}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={previousQuestion}
          disabled={currentIndex === 0}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-30"
        >
          Previous
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || answers.length === 0}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
