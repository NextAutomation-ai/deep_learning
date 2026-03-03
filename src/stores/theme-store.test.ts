import { describe, it, expect, beforeEach, vi } from "vitest";
import { useThemeStore } from "./theme-store";

// Mock localStorage and DOM APIs for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
Object.defineProperty(globalThis, "document", {
  value: {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
  },
});

describe("useThemeStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    useThemeStore.setState({
      theme: "system",
      resolvedTheme: "light",
    });
  });

  it("has correct initial state", () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe("system");
    expect(state.resolvedTheme).toBe("light");
  });

  it("setTheme to dark updates theme and resolvedTheme", () => {
    useThemeStore.getState().setTheme("dark");
    const state = useThemeStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.resolvedTheme).toBe("dark");
  });

  it("setTheme to light updates theme and resolvedTheme", () => {
    useThemeStore.getState().setTheme("light");
    const state = useThemeStore.getState();
    expect(state.theme).toBe("light");
    expect(state.resolvedTheme).toBe("light");
  });

  it("setTheme persists to localStorage", () => {
    useThemeStore.getState().setTheme("dark");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("deeplearn-theme", "dark");
  });

  it("setTheme to dark adds dark class to documentElement", () => {
    useThemeStore.getState().setTheme("dark");
    expect(document.documentElement.classList.add).toHaveBeenCalledWith("dark");
  });
});
