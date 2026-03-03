import { create } from "zustand";

interface LearningStore {
  currentLessonIndex: number;
  expandedLessonId: string | null;
  completedLessons: Set<string>;

  goToLesson: (index: number) => void;
  expandLesson: (id: string | null) => void;
  markLessonComplete: (id: string) => void;
  reset: () => void;
}

export const useLearningStore = create<LearningStore>((set) => ({
  currentLessonIndex: 0,
  expandedLessonId: null,
  completedLessons: new Set(),

  goToLesson: (index) => set({ currentLessonIndex: index }),
  expandLesson: (id) => set({ expandedLessonId: id }),
  markLessonComplete: (id) =>
    set((state) => {
      const updated = new Set(state.completedLessons);
      updated.add(id);
      return { completedLessons: updated };
    }),
  reset: () =>
    set({
      currentLessonIndex: 0,
      expandedLessonId: null,
      completedLessons: new Set(),
    }),
}));
