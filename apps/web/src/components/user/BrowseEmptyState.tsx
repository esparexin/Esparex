"use client";

import { SearchX, Bell } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
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

  return (
    <div
      role="region"
      aria-label="No listings found"
      className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/50 p-8 text-center animate-in fade-in duration-200"
    >
      {/* ── Icon Container ──────────────────────────────────────────────── */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
        <SearchX className="h-8 w-8" />
      </div>

      {/* ── Heading & Description ───────────────────────────────────────── */}
      <h3 className="text-lg font-bold text-slate-900 md:text-xl">
        {categoryName
          ? `No ${categoryName.toLowerCase()} found`
          : query
          ? `No listings matching "${query}"`
          : "No listings found"}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600 leading-relaxed">
        {hasActiveFilters
          ? "Try adjusting your search criteria, widening location filters, or resetting active selections."
          : "There are no live listings available in this section right now. Check back soon or be the first to post an ad!"}
      </p>

      {/* ── Action Buttons Cluster ──────────────────────────────────────── */}
      {query && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            variant="outline"
            className="gap-2 rounded-xl border-blue-200 bg-blue-50/50 font-semibold text-blue-700 hover:bg-blue-100/50"
          >
            <Link href="/account/alerts">
              <Bell className="h-4 w-4 text-blue-600" />
              Notify Me
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
