import { Skeleton } from "@esparex/ui";
import { cn } from "@/lib/utils";

interface AdCardSkeletonProps {
  className?: string;
}

export function AdCardSkeleton({ className }: AdCardSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border border-border p-2 sm:p-2.5 bg-card shadow-sm", className)}>
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
