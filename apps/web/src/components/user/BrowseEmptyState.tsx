"use client";

import { SearchX, Bell } from "@esparex/ui";
import { Button, EmptyState } from "@esparex/ui";
import Link from "next/link";

export interface BrowseEmptyStateProps {
  activeFilterCount?: number;
  query?: string;
  categoryName?: string | null;
  onResetFilters?: () => void;
  onPostAdClick?: () => void;
}

export function BrowseEmptyState({
  activeFilterCount = 0,
  query = "",
  categoryName = null,
  onResetFilters,
}: BrowseEmptyStateProps) {
  const hasActiveFilters = activeFilterCount > 0 || Boolean(query);

  const title = categoryName
    ? `No listings found in ${categoryName}`
    : query
    ? `No results matching "${query}"`
    : "No listings found";

  const description = hasActiveFilters
    ? "Try different keywords or clear active filters."
    : "No listings are available in this area right now.";

  const action = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {activeFilterCount > 0 && onResetFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="h-9 px-3.5 rounded-xl text-small font-medium border-border hover:bg-muted"
        >
          Clear Filters
        </Button>
      )}
      {query && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 h-9 px-3.5 rounded-xl text-small font-medium border-border hover:bg-muted"
        >
          <Link href="/account/alerts">
            <Bell className="h-3.5 w-3.5 text-primary" />
            Notify Me
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <EmptyState
      variant="simple"
      icon={SearchX}
      title={title}
      description={description}
      action={query || (activeFilterCount > 0 && onResetFilters) ? action : undefined}
    />
  );
}
