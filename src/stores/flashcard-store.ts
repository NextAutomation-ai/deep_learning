import { create } from "zustand";

export interface FlashcardItem {
  id: string;
  contentId: string;
  conceptId: string | null;
  frontText: string;
  backText: string;
  difficultyLevel: number | null;
  contentTitle?: string;
  isDue: boolean;
  sm2State: {
    easeFactor: number | null;
    intervalDays: number | null;
    repetitions: number | null;
    masteryLevel: number | null;
  } | null;
}

interface FlashcardStore {
  cards: FlashcardItem[];
  currentIndex: number;
  isFlipped: boolean;
  mode: "flip" | "type_answer";
  reviewedCount: number;
  correctCount: number;
  sessionActive: boolean;

  startSession: (cards: FlashcardItem[], mode?: "flip" | "type_answer") => void;
  flipCard: () => void;
  nextCard: () => void;
  recordReview: (correct: boolean) => void;
  endSession: () => void;
}

export const useFlashcardStore = create<FlashcardStore>((set) => ({
  cards: [],
  currentIndex: 0,
  isFlipped: false,
  mode: "flip",
  reviewedCount: 0,
  correctCount: 0,
  sessionActive: false,

  startSession: (cards, mode = "flip") =>
    set({
      cards,
      currentIndex: 0,
      isFlipped: false,
      mode,
      reviewedCount: 0,
      correctCount: 0,
      sessionActive: true,
    }),

  flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

  nextCard: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      isFlipped: false,
    })),

  recordReview: (correct) =>
    set((state) => ({
      reviewedCount: state.reviewedCount + 1,
      correctCount: state.correctCount + (correct ? 1 : 0),
    })),

  endSession: () =>
    set({ sessionActive: false }),
}));
