"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function ContentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Content Not Available"
      message="We couldn't load this content. It may have been deleted or is still processing."
      onRetry={reset}
      backHref="/library"
      backLabel="Back to Library"
    />
  );
}
