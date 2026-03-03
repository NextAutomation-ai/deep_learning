"use client";

import { useStartQuiz } from "@/hooks/use-quiz";
import { useQuizStore } from "@/stores/quiz-store";
import { Zap, Brain, Trophy, Timer } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const modes = [
  {
    id: "standard",
    label: "Standard Quiz",
    description: "10-20 mixed questions at various difficulties",
    icon: Brain,
    color: "primary",
  },
  {
    id: "adaptive",
    label: "Adaptive Quiz",
    description: "Difficulty adjusts based on your answers",
    icon: Zap,
    color: "accent",
  },
  {
    id: "boss_battle",
    label: "Boss Battle",
    description: "30-50 comprehensive questions. 200 XP reward!",
    icon: Trophy,
    color: "warning",
  },
  {
    id: "speed_round",
    label: "Speed Round",
    description: "10 quick questions, 5 seconds each",
    icon: Timer,
    color: "danger",
  },
];

export function QuizModeSelector({ contentId }: { contentId: string }) {
  const startQuizMutation = useStartQuiz();
  const startQuiz = useQuizStore((s) => s.startQuiz);

  const handleStart = async (mode: string) => {
    const result = await startQuizMutation.mutateAsync({ contentId, mode });
    startQuiz(result.quizId, result.mode, result.questions);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">Choose Quiz Mode</h2>
        <p className="mt-2 text-text-secondary">Test your knowledge</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleStart(mode.id)}
            disabled={startQuizMutation.isPending}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 text-left transition-all hover:shadow-md disabled:opacity-50",
              `hover:border-${mode.color}`
            )}
          >
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", `bg-${mode.color}/10`)}>
              <mode.icon className={cn("h-6 w-6", `text-${mode.color}`)} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{mode.label}</h3>
              <p className="mt-1 text-sm text-text-secondary">{mode.description}</p>
            </div>
          </button>
        ))}
      </div>

      {startQuizMutation.isPending && (
        <p className="text-center text-sm text-text-secondary">Loading questions...</p>
      )}
    </div>
  );
}
