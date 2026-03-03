import { describe, it, expect, beforeEach } from "vitest";
import { useFlashcardStore, type FlashcardItem } from "./flashcard-store";

const mockCards: FlashcardItem[] = [
  {
    id: "card-1",
    contentId: "c1",
    conceptId: "con1",
    frontText: "What is React?",
    backText: "A JS library for UIs",
    difficultyLevel: 1,
    isDue: true,
    sm2State: null,
  },
  {
    id: "card-2",
    contentId: "c1",
    conceptId: "con2",
    frontText: "What is JSX?",
    backText: "JavaScript XML syntax",
    difficultyLevel: 1,
    isDue: true,
    sm2State: null,
  },
  {
    id: "card-3",
    contentId: "c1",
    conceptId: "con3",
    frontText: "What is a hook?",
    backText: "A function for state/effects",
    difficultyLevel: 2,
    isDue: false,
    sm2State: null,
  },
];

describe("useFlashcardStore", () => {
  beforeEach(() => {
    useFlashcardStore.setState({
      cards: [],
      currentIndex: 0,
      isFlipped: false,
      mode: "flip",
      reviewedCount: 0,
      correctCount: 0,
      sessionActive: false,
    });
  });

  it("has correct initial state", () => {
    const state = useFlashcardStore.getState();
    expect(state.cards).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.isFlipped).toBe(false);
    expect(state.mode).toBe("flip");
    expect(state.reviewedCount).toBe(0);
    expect(state.correctCount).toBe(0);
    expect(state.sessionActive).toBe(false);
  });

  it("startSession populates cards and activates session", () => {
    useFlashcardStore.getState().startSession(mockCards);
    const state = useFlashcardStore.getState();
    expect(state.cards).toHaveLength(3);
    expect(state.sessionActive).toBe(true);
    expect(state.currentIndex).toBe(0);
    expect(state.isFlipped).toBe(false);
  });

  it("startSession accepts mode parameter", () => {
    useFlashcardStore.getState().startSession(mockCards, "type_answer");
    expect(useFlashcardStore.getState().mode).toBe("type_answer");
  });

  it("flipCard toggles isFlipped", () => {
    useFlashcardStore.getState().startSession(mockCards);
    expect(useFlashcardStore.getState().isFlipped).toBe(false);
    useFlashcardStore.getState().flipCard();
    expect(useFlashcardStore.getState().isFlipped).toBe(true);
    useFlashcardStore.getState().flipCard();
    expect(useFlashcardStore.getState().isFlipped).toBe(false);
  });

  it("nextCard advances currentIndex and resets flip", () => {
    useFlashcardStore.getState().startSession(mockCards);
    useFlashcardStore.getState().flipCard(); // flip first card
    useFlashcardStore.getState().nextCard();
    const state = useFlashcardStore.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.isFlipped).toBe(false);
  });

  it("recordReview tracks correct and reviewed counts", () => {
    useFlashcardStore.getState().startSession(mockCards);
    useFlashcardStore.getState().recordReview(true);
    expect(useFlashcardStore.getState().reviewedCount).toBe(1);
    expect(useFlashcardStore.getState().correctCount).toBe(1);

    useFlashcardStore.getState().recordReview(false);
    expect(useFlashcardStore.getState().reviewedCount).toBe(2);
    expect(useFlashcardStore.getState().correctCount).toBe(1);
  });

  it("endSession deactivates session", () => {
    useFlashcardStore.getState().startSession(mockCards);
    expect(useFlashcardStore.getState().sessionActive).toBe(true);
    useFlashcardStore.getState().endSession();
    expect(useFlashcardStore.getState().sessionActive).toBe(false);
  });

  it("startSession resets counts from previous session", () => {
    useFlashcardStore.getState().startSession(mockCards);
    useFlashcardStore.getState().recordReview(true);
    useFlashcardStore.getState().recordReview(true);
    useFlashcardStore.getState().nextCard();

    // Start a new session
    useFlashcardStore.getState().startSession(mockCards.slice(0, 1));
    const state = useFlashcardStore.getState();
    expect(state.reviewedCount).toBe(0);
    expect(state.correctCount).toBe(0);
    expect(state.currentIndex).toBe(0);
    expect(state.cards).toHaveLength(1);
  });
});
