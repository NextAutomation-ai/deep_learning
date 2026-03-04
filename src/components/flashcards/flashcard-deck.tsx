"use client";

import { useFlashcards, useReviewFlashcard } from "@/hooks/use-flashcards";
import { useFlashcardStore } from "@/stores/flashcard-store";
import { FlashcardCard } from "./flashcard-card";
import { FlashcardRating } from "./flashcard-rating";
import { Layers, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { SignInGate } from "@/components/auth/sign-in-gate";

export function FlashcardDeck({ contentId }: { contentId: string }) {
  const { data: sessionData } = useSession();
  const isGuest = !sessionData?.user;
  const [showGate, setShowGate] = useState(false);
  const { data, isLoading } = useFlashcards(contentId);
  const reviewMutation = useReviewFlashcard();
  const {
    cards,
    currentIndex,
    isFlipped,
    reviewedCount,
    correctCount,
    sessionActive,
    startSession,
    flipCard,
    nextCard,
    recordReview,
    endSession,
  } = useFlashcardStore();

  if (isLoading) {
    return <p className="text-center text-text-secondary">Loading flashcards...</p>;
  }

  if (!data?.flashcards?.length) {
    return (
      <div className="py-12 text-center">
        <Layers className="mx-auto mb-3 h-12 w-12 text-text-secondary/40" />
        <p className="text-text-secondary">No flashcards available.</p>
        <p className="mt-1 text-sm text-text-secondary">Process content first to generate flashcards.</p>
      </div>
    );
  }

  // Start session view
  if (!sessionActive) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="rounded-xl border border-border bg-surface p-8">
          <Layers className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="text-2xl font-bold text-text-primary">Flashcards</h2>
          <div className="mt-4 space-y-2 text-sm text-text-secondary">
            <p>{data.total} total cards</p>
            <p className="font-medium text-primary">{data.dueCount} due for review</p>
          </div>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => startSession(data.flashcards)}
              className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Study All Cards
            </button>
            {data.dueCount > 0 && (
              <button
                onClick={() =>
                  startSession(
                    data.flashcards.filter(
                      (c: { isDue: boolean }) => c.isDue
                    )
                  )
                }
                className="rounded-lg border border-primary px-8 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Study {data.dueCount} Due Cards
              </button>
            )}
          </div>
        </div>

        {reviewedCount > 0 && (
          <p className="text-sm text-text-secondary">
            Last session: {correctCount}/{reviewedCount} correct
          </p>
        )}
      </div>
    );
  }

  // Session complete
  if (currentIndex >= cards.length) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-8 text-center">
        <h2 className="text-2xl font-bold text-text-primary">Session Complete!</h2>
        <p className="mt-2 text-text-secondary">
          Reviewed {reviewedCount} cards &middot; {correctCount} correct
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              endSession();
              startSession(data.flashcards);
            }}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
          >
            <RotateCcw className="h-4 w-4" />
            Review Again
          </button>
          <button
            onClick={endSession}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRate = async (rating: 1 | 3 | 4 | 5) => {
    recordReview(rating >= 3);

    if (currentCard.conceptId) {
      reviewMutation.mutate({
        flashcardId: currentCard.id,
        contentId,
        conceptId: currentCard.conceptId,
        rating,
      });
    }

    if (isGuest && currentIndex === 0) {
      setShowGate(true);
      return;
    }

    nextCard();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>
          Card {currentIndex + 1} of {cards.length}
        </span>
        <span>{cards.length - currentIndex - 1} remaining</span>
      </div>
      <div className="h-1.5 rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <FlashcardCard
        front={currentCard.frontText}
        back={currentCard.backText}
        isFlipped={isFlipped}
        onFlip={flipCard}
      />

      {/* Rating (only after flip) */}
      {isFlipped && <FlashcardRating onRate={handleRate} />}

      {/* Flip prompt */}
      {!isFlipped && (
        <p className="text-center text-sm text-text-secondary">
          Click or press Space to reveal answer
        </p>
      )}

      <SignInGate
        open={showGate}
        onOpenChange={setShowGate}
        featureName="Flashcards"
        message="You've previewed 1 flashcard! Sign in to study all cards and track your progress."
      />
    </div>
  );
}
