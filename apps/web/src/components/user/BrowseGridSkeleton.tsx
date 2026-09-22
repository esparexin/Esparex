"use client";

import { Skeleton } from "@esparex/ui";

export function BrowseGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 lg:gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-row sm:flex-col items-stretch gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border bg-card">
          <Skeleton className="w-24 h-24 sm:w-full sm:aspect-[4/3] shrink-0 rounded-l-xl sm:rounded-t-2xl sm:rounded-l-none" />
          <div className="flex flex-1 flex-col justify-between py-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
