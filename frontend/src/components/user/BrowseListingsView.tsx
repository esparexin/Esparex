"use client";

import { BrowseFiltersBar } from "@/components/user/BrowseFiltersBar";
import { BrowseListingResults } from "@/components/user/BrowseListingResults";
import type { BrowseResultsContentProps } from "@/components/user/BrowseResultsPanel";
import { useBrowseListingsController } from "@/components/user/useBrowseListingsController";
import type { LocationData } from "@/context/LocationContext";
import type { Category } from "@/lib/api/user/categories";
import type { PublicBrowseType } from "@/lib/publicBrowseRoutes";

type BrowsePageResult<TItem> = {
  data: TItem[];
  pagination: {
    total?: number;
    hasMore?: boolean;
  };
};

export interface BrowseBuildFiltersArgs {
  page: number;
  pageSize: number;
  query: string;
  selectedCategory: string;
  location: LocationData;
  sort: "relevance" | "newest" | "price_low_high" | "price_high_low";
  urlLocationId?: string;
  urlLocationLabel?: string;
  radiusKm?: number;
}

interface BrowseListingsViewProps<TItem, TFilters>
  extends BrowseResultsContentProps<TItem> {
  browseType: PublicBrowseType;
  initialCategory?: string;
  initialSearchQuery?: string;
  initialResults?: BrowsePageResult<TItem>;
  initialCategories?: Category[];
  logScope: string;
  loadErrorMessage: string;
  buildFilters: (args: BrowseBuildFiltersArgs) => TFilters;
  fetchPage: (filters: TFilters) => Promise<BrowsePageResult<TItem>>;
  searchAriaLabel: string;
  searchPlaceholder: string;
  inputId?: string;
  getCategoryValue?: (category: Category) => string;
  respectMobileChromePolicy?: boolean;
  inputClassName?: string;
  selectTriggerClassName?: string;
}

export function BrowseListingsView<TItem, TFilters>({
  browseType,
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
  logScope,
  loadErrorMessage,
  buildFilters,
  fetchPage,
  searchAriaLabel,
  searchPlaceholder,
  inputId,
  getCategoryValue,
  respectMobileChromePolicy,
  inputClassName,
  selectTriggerClassName,
  emptyTitle,
  getEmptyDescription,
  renderCard,
  getItemKey,
  VirtualizedListComponent,
  virtualizationThreshold,
}: BrowseListingsViewProps<TItem, TFilters>) {
  const {
    query,
    inputValue,
    selectedCategory,
    sort,
    view,
    loading,
    error,
    hasMore,
    total,
    categories,
    items,
    handleCategoryChange,
    handleSortChange,
    setView,
    handleInputChange,
    handleReset,
    handleLoadMore,
    handleRetry,
  } = useBrowseListingsController<TItem, TFilters>({
    browseType,
    initialCategory,
    initialSearchQuery,
    initialResults,
    initialCategories,
    logScope,
    loadErrorMessage,
    buildFilters,
    fetchPage,
  });

  return (
    <div className="min-h-screen bg-slate-50/40">
      <BrowseFiltersBar
        inputId={inputId}
        inputValue={inputValue}
        selectedCategory={selectedCategory}
        categories={categories}
        searchAriaLabel={searchAriaLabel}
        searchPlaceholder={searchPlaceholder}
        onInputChange={handleInputChange}
        onCategoryChange={handleCategoryChange}
        onReset={handleReset}
        getCategoryValue={getCategoryValue}
        respectMobileChromePolicy={respectMobileChromePolicy}
        inputClassName={inputClassName}
        selectTriggerClassName={selectTriggerClassName}
      />

      <BrowseListingResults
        items={items}
        total={total}
        sort={sort}
        view={view}
        loading={loading}
        error={error}
        hasMore={hasMore}
        query={query}
        onSortChange={handleSortChange}
        onViewChange={setView}
        onRetry={handleRetry}
        onReset={handleReset}
        onLoadMore={handleLoadMore}
        emptyTitle={emptyTitle}
        getEmptyDescription={getEmptyDescription}
        renderCard={renderCard}
        getItemKey={getItemKey}
        VirtualizedListComponent={VirtualizedListComponent}
        virtualizationThreshold={virtualizationThreshold}
      />
    </div>
  );
}
