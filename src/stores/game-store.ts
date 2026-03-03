import { create } from "zustand";

export type GameType = "concept_clash" | "connection" | "concept_tower" | null;

interface ClashQuestion {
  id: string;
  conceptName: string;
  definition: string;
  options: string[];
  correctIndex: number;
}

interface ConnectionPair {
  id: string;
  conceptName: string;
  relatedName: string;
}

interface TowerBlock {
  id: string;
  conceptName: string;
  definition: string;
  difficulty: number;
  question: string;
  answer: string;
  options: string[];
  correctIndex: number;
}

interface GameResult {
  gameType: string;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  xpEarned: number;
  streakBonus: number;
  totalXp: number;
  newBadges: string[];
  won?: boolean;
  levelsCompleted?: number;
}

interface GameStore {
  // Current game state
  activeGame: GameType;
  isPlaying: boolean;
  result: GameResult | null;

  // Concept Clash state
  clashQuestions: ClashQuestion[];
  clashCurrentIndex: number;
  clashScore: number;
  clashCorrect: number;
  clashStreak: number;
  clashTimeLeft: number;

  // Connection Game state
  connectionPairs: ConnectionPair[];
  connectionMatched: string[];
  connectionSelected: { side: "left" | "right"; id: string; name: string } | null;
  connectionCorrect: number;

  // Concept Tower state
  towerBlocks: TowerBlock[];
  towerCurrentLevel: number;
  towerLives: number;
  towerMaxLives: number;

  // Actions
  startClash: (questions: ClashQuestion[]) => void;
  answerClash: (selectedIndex: number) => void;
  nextClashQuestion: () => void;

  startConnection: (pairs: ConnectionPair[]) => void;
  selectConnection: (side: "left" | "right", id: string, name: string) => void;
  matchConnection: () => boolean;

  startTower: (blocks: TowerBlock[], lives: number) => void;
  answerTower: (selectedIndex: number) => boolean;

  setResult: (result: GameResult) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  activeGame: null,
  isPlaying: false,
  result: null,

  clashQuestions: [],
  clashCurrentIndex: 0,
  clashScore: 0,
  clashCorrect: 0,
  clashStreak: 0,
  clashTimeLeft: 15,

  connectionPairs: [],
  connectionMatched: [],
  connectionSelected: null,
  connectionCorrect: 0,

  towerBlocks: [],
  towerCurrentLevel: 0,
  towerLives: 3,
  towerMaxLives: 3,

  startClash: (questions) =>
    set({
      activeGame: "concept_clash",
      isPlaying: true,
      result: null,
      clashQuestions: questions,
      clashCurrentIndex: 0,
      clashScore: 0,
      clashCorrect: 0,
      clashStreak: 0,
      clashTimeLeft: 15,
    }),

  answerClash: (selectedIndex) => {
    const { clashQuestions, clashCurrentIndex, clashScore, clashCorrect, clashStreak } = get();
    const question = clashQuestions[clashCurrentIndex];
    if (!question) return;

    const isCorrect = selectedIndex === question.correctIndex;
    const newStreak = isCorrect ? clashStreak + 1 : 0;
    const multiplier = newStreak >= 8 ? 4 : newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
    const points = isCorrect ? 10 * multiplier : 0;

    set({
      clashScore: clashScore + points,
      clashCorrect: clashCorrect + (isCorrect ? 1 : 0),
      clashStreak: newStreak,
    });
  },

  nextClashQuestion: () => {
    const { clashCurrentIndex, clashQuestions } = get();
    if (clashCurrentIndex + 1 >= clashQuestions.length) {
      set({ isPlaying: false });
    } else {
      set({ clashCurrentIndex: clashCurrentIndex + 1, clashTimeLeft: 15 });
    }
  },

  startConnection: (pairs) =>
    set({
      activeGame: "connection",
      isPlaying: true,
      result: null,
      connectionPairs: pairs,
      connectionMatched: [],
      connectionSelected: null,
      connectionCorrect: 0,
    }),

  selectConnection: (side, id, name) => {
    const { connectionSelected } = get();
    if (connectionSelected && connectionSelected.side === side) {
      // Same side — replace selection
      set({ connectionSelected: { side, id, name } });
    } else if (!connectionSelected) {
      set({ connectionSelected: { side, id, name } });
    }
    // If different side, the component should call matchConnection
  },

  matchConnection: () => {
    const { connectionSelected, connectionPairs, connectionMatched, connectionCorrect } = get();
    if (!connectionSelected) return false;
    // This is called after a second selection from the opposite side
    // The component manages the matching logic
    return false;
  },

  startTower: (blocks, lives) =>
    set({
      activeGame: "concept_tower",
      isPlaying: true,
      result: null,
      towerBlocks: blocks,
      towerCurrentLevel: 0,
      towerLives: lives,
      towerMaxLives: lives,
    }),

  answerTower: (selectedIndex) => {
    const { towerBlocks, towerCurrentLevel, towerLives } = get();
    const block = towerBlocks[towerCurrentLevel];
    if (!block) return false;

    const isCorrect = selectedIndex === block.correctIndex;

    if (isCorrect) {
      if (towerCurrentLevel + 1 >= towerBlocks.length) {
        set({ towerCurrentLevel: towerCurrentLevel + 1, isPlaying: false });
      } else {
        set({ towerCurrentLevel: towerCurrentLevel + 1 });
      }
    } else {
      const newLives = towerLives - 1;
      if (newLives <= 0) {
        set({ towerLives: 0, isPlaying: false });
      } else {
        set({ towerLives: newLives });
      }
    }

    return isCorrect;
  },

  setResult: (result) => set({ result }),

  resetGame: () =>
    set({
      activeGame: null,
      isPlaying: false,
      result: null,
      clashQuestions: [],
      clashCurrentIndex: 0,
      clashScore: 0,
      clashCorrect: 0,
      clashStreak: 0,
      connectionPairs: [],
      connectionMatched: [],
      connectionSelected: null,
      connectionCorrect: 0,
      towerBlocks: [],
      towerCurrentLevel: 0,
      towerLives: 3,
    }),
}));
