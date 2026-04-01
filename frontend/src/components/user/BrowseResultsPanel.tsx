"use client";

import { Fragment, type ComponentType, type ReactNode } from "react";
import { PackageOpen, RefreshCw } from "lucide-react";

import type { SortOption } from "@/components/search/SearchResultsHeader";
import { SearchResultsHeader } from "@/components/search/SearchResultsHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type BrowseVirtualizedListProps<TItem> = {
  items: TItem[];
  view: "grid" | "list";
};

export interface BrowseResultsContentProps<TItem> {
  emptyTitle: string;
  getEmptyDescription: (query: string) => string;
  renderCard: (item: TItem) => ReactNode;
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
  onSortChange: (value: SortOption) => void;
  onViewChange: (value: "grid" | "list") => void;
  onRetry: () => void;
  onReset: () => void;
  onLoadMore: () => void;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-slate-100 p-6 mb-4">
            <PackageOpen className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{emptyTitle}</h3>
          <p className="text-slate-500 max-w-xs mb-6">{getEmptyDescription(query)}</p>
          <Button variant="outline" onClick={onReset}>
            Clear Filters
          </Button>
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
                  : "grid grid-cols-2 gap-3 pb-8 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
              }
            >
              {items.map((item) => (
                <Fragment key={getItemKey(item)}>{renderCard(item)}</Fragment>
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
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : null}
    </div>
  );
}
