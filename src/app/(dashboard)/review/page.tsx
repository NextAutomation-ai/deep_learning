"use client";

import { useEffect } from "react";
import { useDueCards } from "@/hooks/use-due-flashcards";
import { useReviewFlashcard } from "@/hooks/use-flashcards";
import { useFlashcardStore } from "@/stores/flashcard-store";
import { FlashcardCard } from "@/components/flashcards/flashcard-card";
import { FlashcardRating } from "@/components/flashcards/flashcard-rating";
import { CheckCircle, Layers, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function ReviewPage() {
  const { data, isLoading, refetch } = useDueCards();
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

  // Auto-start session when data loads
  useEffect(() => {
    if (data?.flashcards?.length && !sessionActive && reviewedCount === 0) {
      startSession(data.flashcards);
    }
  }, [data, sessionActive, reviewedCount, startSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No due cards
  if (!data?.flashcards?.length && !sessionActive) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">All caught up!</h2>
        <p className="mt-2 text-text-secondary">
          No flashcards are due for review right now. Check back later.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Session complete
  if (sessionActive && currentIndex >= cards.length) {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-success" />
          <h2 className="text-2xl font-bold text-text-primary">
            Review Complete!
          </h2>
          <p className="mt-2 text-text-secondary">
            Reviewed {reviewedCount} cards &middot; {correctCount} correct
          </p>
          <div className="mt-2 text-sm text-text-secondary">
            {reviewedCount > 0 &&
              `${Math.round((correctCount / reviewedCount) * 100)}% accuracy`}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => {
                endSession();
                refetch();
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
            >
              <RotateCcw className="h-4 w-4" />
              Check for More
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Done
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pre-session screen (shouldn't normally show due to auto-start, but fallback)
  if (!sessionActive) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <Layers className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="text-2xl font-bold text-text-primary">
          Spaced Repetition Review
        </h2>
        <p className="mt-2 text-text-secondary">
          {data?.flashcards?.length ?? 0} cards due across all your content
        </p>
        <button
          onClick={() => data?.flashcards && startSession(data.flashcards)}
          className="mt-6 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white hover:bg-primary/90"
        >
          Start Review
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRate = (rating: 1 | 3 | 4 | 5) => {
    recordReview(rating >= 3);

    if (currentCard.conceptId) {
      reviewMutation.mutate({
        flashcardId: currentCard.id,
        contentId: currentCard.contentId,
        conceptId: currentCard.conceptId,
        rating,
      });
    }

    nextCard();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          Spaced Repetition Review
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review due cards from all your content
        </p>
      </div>

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

      {/* Content source badge */}
      {currentCard.contentTitle && (
        <div className="text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            From: {currentCard.contentTitle}
          </span>
        </div>
      )}

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
    </div>
  );
}
