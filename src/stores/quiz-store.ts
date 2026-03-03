import { create } from "zustand";

interface QuizQuestion {
  id: string;
  questionType: string;
  questionText: string;
  options: string[] | null;
  difficultyLevel: number | null;
  bloomsLevel: string | null;
  points: number | null;
  timeLimitSeconds: number | null;
  conceptId: string | null;
}

interface UserAnswer {
  questionId: string;
  userAnswer: string;
  timeTaken: number;
}

interface QuizStore {
  quizId: string | null;
  mode: string | null;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: UserAnswer[];
  startedAt: Date | null;
  showFeedback: boolean;
  lastAnswerCorrect: boolean | null;

  startQuiz: (quizId: string, mode: string, questions: QuizQuestion[]) => void;
  answerQuestion: (answer: UserAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setShowFeedback: (show: boolean, correct?: boolean) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  quizId: null,
  mode: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  startedAt: null,
  showFeedback: false,
  lastAnswerCorrect: null,

  startQuiz: (quizId, mode, questions) =>
    set({
      quizId,
      mode,
      questions,
      currentIndex: 0,
      answers: [],
      startedAt: new Date(),
      showFeedback: false,
      lastAnswerCorrect: null,
    }),

  answerQuestion: (answer) =>
    set((state) => ({
      answers: [
        ...state.answers.filter((a) => a.questionId !== answer.questionId),
        answer,
      ],
    })),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
      showFeedback: false,
    })),

  previousQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
      showFeedback: false,
    })),

  setShowFeedback: (show, correct) =>
    set({ showFeedback: show, lastAnswerCorrect: correct ?? null }),

  resetQuiz: () =>
    set({
      quizId: null,
      mode: null,
      questions: [],
      currentIndex: 0,
      answers: [],
      startedAt: null,
      showFeedback: false,
      lastAnswerCorrect: null,
    }),
}));
