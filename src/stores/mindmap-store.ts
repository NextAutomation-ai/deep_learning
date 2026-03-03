import { create } from "zustand";

export type ColorMode = "mastery" | "difficulty" | "blooms";

interface MindmapStore {
  colorMode: ColorMode;
  selectedNodeId: string | null;
  searchQuery: string;
  showLabels: boolean;
  showLegend: boolean;

  setColorMode: (mode: ColorMode) => void;
  selectNode: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleLabels: () => void;
  toggleLegend: () => void;
}

export const useMindmapStore = create<MindmapStore>((set) => ({
  colorMode: "mastery",
  selectedNodeId: null,
  searchQuery: "",
  showLabels: true,
  showLegend: false,

  setColorMode: (mode) => set({ colorMode: mode }),
  selectNode: (id) => set({ selectedNodeId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleLegend: () => set((state) => ({ showLegend: !state.showLegend })),
}));
