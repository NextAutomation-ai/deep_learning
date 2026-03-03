import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StudyPreferences {
  dailyGoal: number;
  showDueCountBadge: boolean;
}

interface SettingsStore {
  preferences: StudyPreferences;
  setPreference: <K extends keyof StudyPreferences>(
    key: K,
    value: StudyPreferences[K]
  ) => void;
  resetPreferences: () => void;
}

const defaultPreferences: StudyPreferences = {
  dailyGoal: 20,
  showDueCountBadge: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreference: (key, value) =>
        set((s) => ({
          preferences: { ...s.preferences, [key]: value },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    { name: "deeplearn-settings" }
  )
);
