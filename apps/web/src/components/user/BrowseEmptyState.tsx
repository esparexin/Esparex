"use client";

import { SearchX, RotateCcw, PlusCircle, Bell, LayoutGrid } from "lucide-react";
import { Button } from "@esparex/ui";
import Link from "next/link";

export interface BrowseEmptyStateProps {
  activeFilterCount?: number;
  query?: string;
  categoryName?: string | null;
  onResetFilters: () => void;
  onPostAdClick?: () => void;
}

export function BrowseEmptyState({
  activeFilterCount = 0,
  query = "",
  categoryName = null,
  onResetFilters,
  onPostAdClick,
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
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="gap-2 rounded-xl border-slate-200 bg-white font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            Reset Filters
          </Button>
        )}

        <Button
          asChild
          variant="secondary"
          className="gap-2 rounded-xl font-semibold shadow-sm"
        >
          <Link href="/browse-spare-parts">
            <LayoutGrid className="h-4 w-4" />
            Browse Categories
          </Link>
        </Button>

        {query && (
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
        )}

        {onPostAdClick && (
          <Button
            onClick={onPostAdClick}
            className="gap-2 rounded-xl font-semibold shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Post an Ad
          </Button>
        )}
      </div>
    </div>
  );
}
