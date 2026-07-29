import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";

interface AdCardSkeletonProps {
  className?: string;
}

export function AdCardSkeleton({ className }: AdCardSkeletonProps) {
  return (
    <div className={cn("space-y-3 rounded-2xl border border-border p-3 bg-white shadow-sm", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function AdCardListSkeleton({ className }: AdCardSkeletonProps) {
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-xl border border-border bg-white shadow-sm", className)}>
      <Skeleton className="h-22 w-22 sm:h-28 sm:w-28 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col justify-between space-y-2 py-0.5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
