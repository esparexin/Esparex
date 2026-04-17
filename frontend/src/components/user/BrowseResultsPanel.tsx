"use client";

import { Fragment, type ComponentType, type ReactNode } from "react";
import { PackageOpen, RefreshCw } from "lucide-react";

import type { SortOption } from "@/components/search/SearchResultsHeader";
import { SearchResultsHeader } from "@/components/search/SearchResultsHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PUBLIC_BROWSE_SORT_LABELS } from "@/lib/publicBrowseSort";

export type BrowseVirtualizedListProps<TItem> = {
  items: TItem[];
  view: "grid" | "list";
};

export interface BrowseResultsContentProps<TItem> {
  emptyTitle: string;
  getEmptyDescription: (query: string) => string;
  renderCard: (item: TItem, view: "grid" | "list", index: number) => ReactNode;
  getItemKey: (item: TItem) => string | number;
  VirtualizedListComponent?: ComponentType<BrowseVirtualizedListProps<TItem>>;
  virtualizationThreshold?: number;
}

export interface BrowseResultsPanelProps<TItem>
  extends BrowseResultsContentProps<TItem> {
  items: TItem[];
  total: number;
  sort: SortOption;
  view: "grid" | "list";
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  query: string;
  filterNode?: ReactNode;
  activeFilterCount?: number;
  activeFilterBadges?: string[];
  onSortChange: (value: SortOption) => void;
  onViewChange: (value: "grid" | "list") => void;
  onRetry: () => void;
  onReset: () => void;
  onLoadMore: () => void;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function BrowseResultsPanel<TItem>({
  items,
  total,
  sort,
  view,
  loading,
  error,
  hasMore,
  query,
  filterNode,
  activeFilterCount = 0,
  activeFilterBadges = [],
  onSortChange,
  onViewChange,
  onRetry,
  onReset,
  onLoadMore,
  emptyTitle,
  getEmptyDescription,
  renderCard,
  getItemKey,
  VirtualizedListComponent,
  virtualizationThreshold = Number.POSITIVE_INFINITY,
}: BrowseResultsPanelProps<TItem>) {
  const shouldUseVirtualizedList =
    Boolean(VirtualizedListComponent) && items.length > virtualizationThreshold;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 pb-8 md:px-6 lg:px-8 space-y-4">
      <SearchResultsHeader
        total={loading && items.length === 0 ? 0 : total}
        sort={sort}
        view={view}
        filterNode={filterNode}
        activeFilterCount={activeFilterCount}
        onSortChange={onSortChange}
        onViewChange={onViewChange}
      />

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      ) : null}

      {loading && items.length === 0 && !error ? <GridSkeleton /> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4">
            <PackageOpen className="h-10 w-10 text-foreground-subtle" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {activeFilterCount > 0 ? "No results match these filters" : emptyTitle}
          </h3>
          <p className="text-muted-foreground max-w-xl mb-6 text-sm leading-6 sm:text-base">
            {getEmptyDescription(query)}
          </p>
          {activeFilterBadges.length > 0 ? (
            <div className="mb-6 flex max-w-2xl flex-wrap justify-center gap-2">
              {activeFilterBadges.map((badge) => (
                <span
                  key={badge}
                  className="max-w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-foreground-tertiary"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mb-6 text-xs font-medium uppercase tracking-widest text-foreground-subtle">
            Sorted by {PUBLIC_BROWSE_SORT_LABELS[sort]}
          </p>
          {activeFilterCount > 0 ? (
            <Button variant="outline" onClick={onReset}>
              Clear Filters
            </Button>
          ) : null}
        </div>
      ) : null}

      {items.length > 0
        ? shouldUseVirtualizedList && VirtualizedListComponent
          ? <VirtualizedListComponent items={items} view={view} />
          : (
            <div
              className={
                view === "list"
                  ? "flex flex-col gap-3 pb-8"
                  : "grid grid-cols-1 min-[375px]:grid-cols-2 gap-3 pb-8 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
              }
            >
              {items.map((item, index) => (
                <Fragment key={getItemKey(item)}>{renderCard(item, view, index)}</Fragment>
              ))}
            </div>
          )
        : null}

      {hasMore && !loading ? (
        <div className="flex justify-center pt-6">
          <Button variant="outline" size="lg" onClick={onLoadMore} className="min-w-[180px]">
            Load More
          </Button>
        </div>
      ) : null}

      {loading && items.length > 0 ? (
        <div className="flex justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-foreground-subtle" />
        </div>
      ) : null}
    </div>
  );
}
