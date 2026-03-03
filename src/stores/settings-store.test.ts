import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "./settings-store";

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      preferences: {
        dailyGoal: 20,
        showDueCountBadge: true,
      },
    });
  });

  it("has correct default preferences", () => {
    const { preferences } = useSettingsStore.getState();
    expect(preferences.dailyGoal).toBe(20);
    expect(preferences.showDueCountBadge).toBe(true);
  });

  it("setPreference updates dailyGoal", () => {
    useSettingsStore.getState().setPreference("dailyGoal", 50);
    expect(useSettingsStore.getState().preferences.dailyGoal).toBe(50);
  });

  it("setPreference updates showDueCountBadge", () => {
    useSettingsStore.getState().setPreference("showDueCountBadge", false);
    expect(useSettingsStore.getState().preferences.showDueCountBadge).toBe(false);
  });

  it("setPreference does not affect other preferences", () => {
    useSettingsStore.getState().setPreference("dailyGoal", 100);
    expect(useSettingsStore.getState().preferences.showDueCountBadge).toBe(true);
  });

  it("resetPreferences restores defaults", () => {
    useSettingsStore.getState().setPreference("dailyGoal", 99);
    useSettingsStore.getState().setPreference("showDueCountBadge", false);
    useSettingsStore.getState().resetPreferences();

    const { preferences } = useSettingsStore.getState();
    expect(preferences.dailyGoal).toBe(20);
    expect(preferences.showDueCountBadge).toBe(true);
  });
});
