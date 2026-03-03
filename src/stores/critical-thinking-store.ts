import { create } from "zustand";

interface ConversationMessage {
  role: "ai" | "user";
  content: string;
}

interface ScoreSet {
  [key: string]: number;
}

type ActiveModule =
  | "socratic"
  | "argument_map"
  | "devils_advocate"
  | "bias_detection"
  | "teach_back"
  | null;

interface CriticalThinkingStore {
  // Active module
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;

  // Socratic session
  socraticSessionId: string | null;
  socraticConceptName: string | null;
  socraticMessages: ConversationMessage[];
  socraticScores: ScoreSet | null;
  socraticFeedback: string | null;
  socraticXp: number;
  startSocratic: (
    sessionId: string,
    conceptName: string,
    firstQuestion: string
  ) => void;
  addSocraticMessage: (role: "ai" | "user", content: string) => void;
  completeSocratic: (scores: ScoreSet, feedback: string, xp: number) => void;

  // Devil's Advocate
  debateId: string | null;
  debateClaim: string | null;
  steelManMode: boolean;
  debateMessages: ConversationMessage[];
  debateScores: ScoreSet | null;
  debateFeedback: string | null;
  debateXp: number;
  startDebate: (
    debateId: string,
    claim: string,
    aiResponse: string,
    steelMan: boolean
  ) => void;
  addDebateMessage: (role: "ai" | "user", content: string) => void;
  completeDebate: (scores: ScoreSet, feedback: string, xp: number) => void;
  toggleSteelMan: () => void;

  // Bias Detection
  biasExerciseId: string | null;
  biasPassage: string | null;
  biasQuestions: string[];
  biasResponses: string[];
  biasScores: ScoreSet | null;
  biasFeedback: string | null;
  biasXp: number;
  startBiasExercise: (
    id: string,
    passage: string,
    questions: string[]
  ) => void;
  setBiasResponse: (index: number, answer: string) => void;
  completeBias: (scores: ScoreSet, feedback: string, xp: number) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  activeModule: null as ActiveModule,
  socraticSessionId: null as string | null,
  socraticConceptName: null as string | null,
  socraticMessages: [] as ConversationMessage[],
  socraticScores: null as ScoreSet | null,
  socraticFeedback: null as string | null,
  socraticXp: 0,
  debateId: null as string | null,
  debateClaim: null as string | null,
  steelManMode: false,
  debateMessages: [] as ConversationMessage[],
  debateScores: null as ScoreSet | null,
  debateFeedback: null as string | null,
  debateXp: 0,
  biasExerciseId: null as string | null,
  biasPassage: null as string | null,
  biasQuestions: [] as string[],
  biasResponses: [] as string[],
  biasScores: null as ScoreSet | null,
  biasFeedback: null as string | null,
  biasXp: 0,
};

export const useCriticalThinkingStore = create<CriticalThinkingStore>(
  (set) => ({
    ...initialState,

    setActiveModule: (module) => set({ activeModule: module }),

    // Socratic
    startSocratic: (sessionId, conceptName, firstQuestion) =>
      set({
        socraticSessionId: sessionId,
        socraticConceptName: conceptName,
        socraticMessages: [{ role: "ai", content: firstQuestion }],
        socraticScores: null,
        socraticFeedback: null,
        socraticXp: 0,
      }),
    addSocraticMessage: (role, content) =>
      set((state) => ({
        socraticMessages: [...state.socraticMessages, { role, content }],
      })),
    completeSocratic: (scores, feedback, xp) =>
      set({
        socraticScores: scores,
        socraticFeedback: feedback,
        socraticXp: xp,
      }),

    // Devil's Advocate
    startDebate: (debateId, claim, aiResponse, steelMan) =>
      set({
        debateId,
        debateClaim: claim,
        steelManMode: steelMan,
        debateMessages: [{ role: "ai", content: aiResponse }],
        debateScores: null,
        debateFeedback: null,
        debateXp: 0,
      }),
    addDebateMessage: (role, content) =>
      set((state) => ({
        debateMessages: [...state.debateMessages, { role, content }],
      })),
    completeDebate: (scores, feedback, xp) =>
      set({
        debateScores: scores,
        debateFeedback: feedback,
        debateXp: xp,
      }),
    toggleSteelMan: () => set((state) => ({ steelManMode: !state.steelManMode })),

    // Bias Detection
    startBiasExercise: (id, passage, questions) =>
      set({
        biasExerciseId: id,
        biasPassage: passage,
        biasQuestions: questions,
        biasResponses: questions.map(() => ""),
        biasScores: null,
        biasFeedback: null,
        biasXp: 0,
      }),
    setBiasResponse: (index, answer) =>
      set((state) => {
        const responses = [...state.biasResponses];
        responses[index] = answer;
        return { biasResponses: responses };
      }),
    completeBias: (scores, feedback, xp) =>
      set({
        biasScores: scores,
        biasFeedback: feedback,
        biasXp: xp,
      }),

    // Reset
    reset: () => set(initialState),
  })
);
