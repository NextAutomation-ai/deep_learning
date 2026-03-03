"use client";

import * as Tabs from "@radix-ui/react-tabs";
import dynamic from "next/dynamic";
import { Brain, Map, BookOpen, HelpCircle, Layers, Lightbulb, Gamepad2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewTab } from "./overview-tab";
import { useMindmapStore } from "@/stores/mindmap-store";
import { useQuizStore } from "@/stores/quiz-store";
import { useState } from "react";

const TabSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

const MindmapCanvas = dynamic(
  () => import("@/components/mindmap/mindmap-canvas").then((m) => m.MindmapCanvas),
  { ssr: false, loading: TabSkeleton }
);
const MindmapControls = dynamic(
  () => import("@/components/mindmap/mindmap-controls").then((m) => m.MindmapControls),
  { ssr: false }
);
const ConceptSidePanel = dynamic(
  () => import("@/components/mindmap/concept-side-panel").then((m) => m.ConceptSidePanel),
  { ssr: false }
);
const QuizModeSelector = dynamic(
  () => import("@/components/quiz/quiz-mode-selector").then((m) => m.QuizModeSelector),
  { loading: TabSkeleton }
);
const QuizEngine = dynamic(
  () => import("@/components/quiz/quiz-engine").then((m) => m.QuizEngine),
  { loading: TabSkeleton }
);
const FlashcardDeck = dynamic(
  () => import("@/components/flashcards/flashcard-deck").then((m) => m.FlashcardDeck),
  { loading: TabSkeleton }
);
const LearningPath = dynamic(
  () => import("@/components/learning/learning-path").then((m) => m.LearningPath),
  { loading: TabSkeleton }
);
const ThinkTab = dynamic(
  () => import("@/components/critical-thinking/think-tab").then((m) => m.ThinkTab),
  { loading: TabSkeleton }
);
const GamesTab = dynamic(
  () => import("@/components/games/games-tab").then((m) => m.GamesTab),
  { loading: TabSkeleton }
);
const DeepDiveChat = dynamic(
  () => import("@/components/deep-dive/deep-dive-chat").then((m) => m.DeepDiveChat),
  { loading: TabSkeleton }
);

interface ContentInfo {
  id: string;
  title: string;
  sourceType: string;
  processingStatus: string;
  conceptCount: number;
  questionCount: number;
  flashcardCount: number;
}

const tabs = [
  { value: "overview", label: "Overview", icon: Brain },
  { value: "mindmap", label: "Mind Map", icon: Map },
  { value: "learn", label: "Learn", icon: BookOpen },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "flashcards", label: "Flashcards", icon: Layers },
  { value: "think", label: "Think", icon: Lightbulb },
  { value: "games", label: "Games", icon: Gamepad2 },
  { value: "deepdive", label: "Deep Dive", icon: MessageSquare },
];

export function ContentTabs({ content }: { content: ContentInfo }) {
  const selectedNodeId = useMindmapStore((s) => s.selectedNodeId);
  const quizActive = useQuizStore((s) => s.quizId !== null);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">{content.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {content.conceptCount} concepts &middot; {content.questionCount} questions &middot;{" "}
          {content.flashcardCount} flashcards
        </p>
      </div>

      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-border bg-surface px-4 sm:px-6">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4",
                "border-transparent text-text-secondary hover:text-text-primary",
                "data-[state=active]:border-primary data-[state=active]:text-primary"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="flex-1 overflow-auto p-6">
          <OverviewTab contentId={content.id} content={content} />
        </Tabs.Content>

        <Tabs.Content value="mindmap" className="relative flex-1 overflow-hidden">
          <MindmapControls />
          <MindmapCanvas contentId={content.id} />
          {selectedNodeId && <ConceptSidePanel conceptId={selectedNodeId} />}
        </Tabs.Content>

        <Tabs.Content value="learn" className="flex-1 overflow-auto p-6">
          <LearningPath contentId={content.id} />
        </Tabs.Content>

        <Tabs.Content value="quiz" className="flex-1 overflow-auto p-6">
          {quizActive ? (
            <QuizEngine contentId={content.id} />
          ) : (
            <QuizModeSelector contentId={content.id} />
          )}
        </Tabs.Content>

        <Tabs.Content value="flashcards" className="flex-1 overflow-auto p-6">
          <FlashcardDeck contentId={content.id} />
        </Tabs.Content>

        <Tabs.Content value="think" className="flex-1 overflow-auto p-6">
          <ThinkTab contentId={content.id} />
        </Tabs.Content>

        <Tabs.Content value="games" className="flex-1 overflow-auto p-6">
          <GamesTab contentId={content.id} />
        </Tabs.Content>

        <Tabs.Content value="deepdive" className="flex-1 overflow-auto p-6">
          <DeepDiveChat contentId={content.id} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
