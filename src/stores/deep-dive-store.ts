import { create } from "zustand";

export type DeepDiveMode = "qa" | "whatif" | "compare";

interface ConversationMessage {
  role: "user" | "ai";
  content: string;
}

interface CompareResult {
  similarities: string[];
  differences: string[];
  relationship: string;
  insight: string;
}

interface DeepDiveStore {
  mode: DeepDiveMode;
  isActive: boolean;
  messages: ConversationMessage[];
  compareResult: CompareResult | null;

  setMode: (mode: DeepDiveMode) => void;
  setActive: (active: boolean) => void;
  addMessage: (role: "user" | "ai", content: string) => void;
  setCompareResult: (result: CompareResult | null) => void;
  reset: () => void;
}

export const useDeepDiveStore = create<DeepDiveStore>((set) => ({
  mode: "qa",
  isActive: false,
  messages: [],
  compareResult: null,

  setMode: (mode) => set({ mode, messages: [], compareResult: null, isActive: false }),
  setActive: (isActive) => set({ isActive }),
  addMessage: (role, content) =>
    set((state) => ({
      messages: [...state.messages, { role, content }],
      isActive: true,
    })),
  setCompareResult: (compareResult) => set({ compareResult }),
  reset: () =>
    set({ mode: "qa", isActive: false, messages: [], compareResult: null }),
}));
