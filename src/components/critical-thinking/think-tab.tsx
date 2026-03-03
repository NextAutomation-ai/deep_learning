"use client";

import { useCriticalThinkingStore } from "@/stores/critical-thinking-store";
import {
  MessageCircleQuestion,
  GitBranch,
  Swords,
  ScanSearch,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { SocraticStarter } from "./socratic-starter";
import { SocraticSession } from "./socratic-session";
import { ArgumentMap } from "./argument-map";
import { DevilsAdvocateStarter } from "./devils-advocate-starter";
import { DevilsAdvocateSession } from "./devils-advocate-session";
import { BiasDetectionExercise } from "./bias-detection-exercise";
import { TeachBackSession } from "./teach-back-session";

const modules = [
  {
    id: "socratic" as const,
    title: "Socratic Questioning",
    description: "AI asks probing questions to deepen your understanding",
    icon: MessageCircleQuestion,
    xp: 75,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "argument_map" as const,
    title: "Argument Mapping",
    description: "Visualize and analyze argument structures",
    icon: GitBranch,
    xp: 30,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    id: "devils_advocate" as const,
    title: "Devil's Advocate",
    description: "Defend your position against AI counter-arguments",
    icon: Swords,
    xp: 100,
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    id: "bias_detection" as const,
    title: "Bias Detection",
    description: "Identify perspectives, biases, and hidden assumptions",
    icon: ScanSearch,
    xp: 50,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    id: "teach_back" as const,
    title: "Teach-Back",
    description: "Explain concepts in your own words for AI evaluation",
    icon: GraduationCap,
    xp: 100,
    color: "text-success",
    bg: "bg-success/10",
  },
];

export function ThinkTab({ contentId }: { contentId: string }) {
  const { activeModule, setActiveModule, socraticSessionId, debateId, reset } =
    useCriticalThinkingStore();

  const handleBack = () => {
    reset();
    setActiveModule(null);
  };

  if (activeModule) {
    return (
      <div className="mx-auto max-w-2xl">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to modules
        </button>

        {activeModule === "socratic" &&
          (socraticSessionId ? (
            <SocraticSession contentId={contentId} />
          ) : (
            <SocraticStarter contentId={contentId} />
          ))}

        {activeModule === "argument_map" && (
          <ArgumentMap contentId={contentId} />
        )}

        {activeModule === "devils_advocate" &&
          (debateId ? (
            <DevilsAdvocateSession contentId={contentId} />
          ) : (
            <DevilsAdvocateStarter contentId={contentId} />
          ))}

        {activeModule === "bias_detection" && (
          <BiasDetectionExercise contentId={contentId} />
        )}

        {activeModule === "teach_back" && (
          <TeachBackSession contentId={contentId} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">
          Critical Thinking
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Sharpen your analytical skills with AI-powered exercises
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${mod.bg}`}
            >
              <mod.icon className={`h-5 w-5 ${mod.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-text-primary">{mod.title}</h3>
              <p className="mt-0.5 text-xs text-text-secondary">
                {mod.description}
              </p>
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                +{mod.xp} XP
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
