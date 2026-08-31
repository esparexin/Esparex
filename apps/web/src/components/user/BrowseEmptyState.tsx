"use client";

import { SearchX, Bell } from "@/icons/IconRegistry";
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
}: BrowseEmptyStateProps) {
  const hasActiveFilters = activeFilterCount > 0 || Boolean(query);

  const title = categoryName
    ? `No ${categoryName.toLowerCase()} found`
    : query
    ? `No listings matching "${query}"`
    : "No listings found";

  const description = hasActiveFilters
    ? "Try adjusting your search criteria, widening location filters, or resetting active selections."
    : "There are no live listings available in this section right now. Check back soon or be the first to post an ad!";

  const action = query ? (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="gap-2 rounded-xl font-semibold border-border hover:bg-muted"
    >
      <Link href="/account/alerts">
        <Bell className="h-4 w-4 text-primary" />
        Notify Me
      </Link>
    </Button>
  ) : undefined;

  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      action={action}
      className="min-h-[340px]"
    />
  );
}
