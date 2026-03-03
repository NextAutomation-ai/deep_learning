"use client";

import { useConceptsByContent } from "@/hooks/use-concepts";
import { useContentProgress } from "@/hooks/use-progress";
import { Brain, HelpCircle, Layers, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ContentInfo {
  id: string;
  title: string;
  sourceType: string;
  processingStatus: string;
  conceptCount: number;
  questionCount: number;
  flashcardCount: number;
}

export function OverviewTab({
  contentId,
  content,
}: {
  contentId: string;
  content: ContentInfo;
}) {
  const { data: conceptsData } = useConceptsByContent(contentId);
  const { data: progress } = useContentProgress(contentId);

  const concepts = conceptsData?.concepts || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Brain}
          label="Concepts"
          value={content.conceptCount}
          color="primary"
        />
        <StatCard
          icon={HelpCircle}
          label="Questions"
          value={content.questionCount}
          color="secondary"
        />
        <StatCard
          icon={Layers}
          label="Flashcards"
          value={content.flashcardCount}
          color="accent"
        />
        <StatCard
          icon={TrendingUp}
          label="Mastery"
          value={progress ? `${Math.round((progress.overallMastery ?? 0) * 100)}%` : "0%"}
          color="success"
        />
      </div>

      {/* Progress Summary */}
      {progress && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 text-lg font-semibold text-text-primary">Progress</h3>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-text-secondary">Concepts Started</p>
              <p className="text-xl font-bold text-text-primary">
                {progress.conceptsStarted}/{progress.totalConcepts}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Mastered</p>
              <p className="text-xl font-bold text-success">
                {progress.conceptsMastered}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Quizzes Taken</p>
              <p className="text-xl font-bold text-text-primary">
                {progress.totalQuizzes}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Avg Score</p>
              <p className="text-xl font-bold text-text-primary">
                {progress.avgQuizScore}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Concept List */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">
          Concepts ({concepts.length})
        </h3>
        <div className="space-y-2">
          {concepts.slice(0, 20).map((c: { id: string; name: string; definition: string; conceptType: string | null; difficultyLevel: number | null; importanceScore: number | null; progress: { masteryLevel: number | null } | null }) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-surface-hover"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary">{c.name}</p>
                <p className="truncate text-sm text-text-secondary">
                  {c.definition}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-3">
                {c.conceptType && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {c.conceptType}
                  </span>
                )}
                <MasteryDot mastery={c.progress?.masteryLevel ?? 0} />
              </div>
            </div>
          ))}
          {concepts.length > 20 && (
            <p className="text-center text-sm text-text-secondary">
              +{concepts.length - 20} more concepts
            </p>
          )}
          {concepts.length === 0 && (
            <p className="py-8 text-center text-text-secondary">
              No concepts yet. Process content first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            `bg-${color}/10`
          )}
        >
          <Icon className={cn("h-5 w-5", `text-${color}`)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MasteryDot({ mastery }: { mastery: number }) {
  const color =
    mastery >= 0.8
      ? "bg-success"
      : mastery >= 0.5
        ? "bg-warning"
        : mastery > 0
          ? "bg-orange-400"
          : "bg-gray-300";

  return (
    <div className={cn("h-3 w-3 rounded-full", color)} title={`${Math.round(mastery * 100)}% mastery`} />
  );
}
