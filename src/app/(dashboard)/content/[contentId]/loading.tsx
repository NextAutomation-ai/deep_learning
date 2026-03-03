import { Skeleton } from "@/components/ui/skeleton";

export default function ContentDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="border-b border-border bg-surface px-6 py-4">
        <Skeleton className="h-7 w-80" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-4 border-b border-border bg-surface px-6 py-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
