"use client";

import { useEffect } from "react";

export function FlashcardCard({
  front,
  back,
  isFlipped,
  onFlip,
}: {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isFlipped) {
        e.preventDefault();
        onFlip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, onFlip]);

  return (
    <div
      className="perspective-1000 cursor-pointer"
      onClick={!isFlipped ? onFlip : undefined}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative h-64 w-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-primary/20 bg-surface p-8"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-center text-lg font-medium text-text-primary">{front}</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-success/20 bg-surface p-8"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-center text-text-primary">{back}</p>
        </div>
      </div>
    </div>
  );
}
