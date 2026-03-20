import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";

interface AdCardSkeletonProps {
  className?: string;
}

export function AdCardSkeleton({ className }: AdCardSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
