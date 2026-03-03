"use client";

import { useLearningPath } from "@/hooks/use-learning-path";
import { useConceptsByContent } from "@/hooks/use-concepts";
import { useLearningStore } from "@/stores/learning-store";
import { LessonCard } from "./lesson-card";
import { LessonViewer } from "./lesson-viewer";
import { BookOpen } from "lucide-react";

export function LearningPath({ contentId }: { contentId: string }) {
  const { data, isLoading } = useLearningPath(contentId);
  const { data: conceptsData } = useConceptsByContent(contentId);
  const { expandedLessonId, expandLesson, completedLessons } = useLearningStore();

  if (isLoading) {
    return <p className="text-center text-text-secondary">Generating learning path...</p>;
  }

  const lessons = data?.lessons || [];
  const allConcepts = conceptsData?.concepts || [];

  if (lessons.length === 0) {
    return (
      <div className="py-12 text-center">
        <BookOpen className="mx-auto mb-3 h-12 w-12 text-text-secondary/40" />
        <p className="text-text-secondary">No learning path available.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Process content first to generate a learning path.
        </p>
      </div>
    );
  }

  const completedCount = lessons.filter((l: { id: string }) =>
    completedLessons.has(l.id)
  ).length;

  // If a lesson is expanded, show the lesson viewer
  if (expandedLessonId) {
    const lesson = lessons.find((l: { id: string }) => l.id === expandedLessonId);
    if (lesson) {
      const lessonConcepts = (lesson.conceptIds as string[])
        .map((id: string) =>
          allConcepts.find((c: { id: string }) => c.id === id)
        )
        .filter(Boolean);

      return (
        <LessonViewer
          lesson={lesson}
          concepts={lessonConcepts}
          contentId={contentId}
          onBack={() => expandLesson(null)}
          onComplete={() => {
            useLearningStore.getState().markLessonComplete(lesson.id);
            expandLesson(null);
          }}
        />
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Learning Path</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {completedCount} of {lessons.length} lessons completed
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{
            width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {lessons.map((lesson: { id: string; title: string; description: string; estimatedMinutes: number; difficulty: number; conceptIds: string[]; order: number }, i: number) => {
          const isCompleted = completedLessons.has(lesson.id);
          const previousCompleted =
            i === 0 || completedLessons.has(lessons[i - 1].id);
          const isAvailable = previousCompleted && !isCompleted;

          return (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={i}
              status={
                isCompleted ? "completed" : isAvailable ? "available" : "locked"
              }
              onClick={() => {
                if (isAvailable || isCompleted) {
                  expandLesson(lesson.id);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
