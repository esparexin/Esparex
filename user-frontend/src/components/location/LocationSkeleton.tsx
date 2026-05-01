/**
 * Skeleton loader for location search results
 * Provides visual feedback while searching
 */

export default function LocationSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="py-1">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
            ))}
        </div>
    );
}
