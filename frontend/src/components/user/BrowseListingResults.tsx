"use client";

import {
  BrowseResultsPanel,
  type BrowseResultsPanelProps,
} from "@/components/user/BrowseResultsPanel";

export interface BrowseListingResultsProps<TItem>
  extends Pick<
    BrowseResultsPanelProps<TItem>,
    | "items"
    | "total"
    | "sort"
    | "view"
    | "loading"
    | "error"
    | "hasMore"
    | "query"
    | "onSortChange"
    | "onViewChange"
    | "onRetry"
    | "onReset"
    | "onLoadMore"
    | "renderCard"
    | "getItemKey"
    | "VirtualizedListComponent"
    | "virtualizationThreshold"
  > {
  emptyTitle: string;
  getEmptyDescription: (query: string) => string;
}

export function BrowseListingResults<TItem>({
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
  virtualizationThreshold,
}: BrowseListingResultsProps<TItem>) {
  return (
    <BrowseResultsPanel
      items={items}
      total={total}
      sort={sort}
      view={view}
      loading={loading}
      error={error}
      hasMore={hasMore}
      query={query}
      onSortChange={onSortChange}
      onViewChange={onViewChange}
      onRetry={onRetry}
      onReset={onReset}
      onLoadMore={onLoadMore}
      emptyTitle={emptyTitle}
      getEmptyDescription={getEmptyDescription}
      renderCard={renderCard}
      getItemKey={getItemKey}
      VirtualizedListComponent={VirtualizedListComponent}
      virtualizationThreshold={virtualizationThreshold}
    />
  );
}
