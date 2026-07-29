"use client";

import { useLocationData } from "@/context/LocationContext";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { BrowseFiltersHeaderTrigger } from "@/components/user/BrowseFiltersBar";
import { BrowseFilterSidebar } from "@/components/user/BrowseFilterSidebar";
import {
  BrowseResultsPanel,
  type BrowseResultsContentProps,
} from "@/components/user/BrowseResultsPanel";
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
  categories: Category[];
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
  respectMobileChromePolicy: _respectMobileChromePolicy,
  inputClassName,
  selectTriggerClassName,
  emptyTitle,
  getEmptyDescription,
  renderCard,
  getItemKey,
  VirtualizedListComponent,
  virtualizationThreshold,
}: BrowseListingsViewProps<TItem, TFilters>) {
  const { location } = useLocationData();
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
    activeFilterCount,
    activeFilterBadges,
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

  const selectedCategoryObj = categories.find((c) =>
    getCategoryValue
      ? getCategoryValue(c) === selectedCategory
      : c.id === selectedCategory || c.name === selectedCategory
  );
  const categoryName = selectedCategoryObj?.name || (selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined);
  const locationLabel = resolveListingLocationLabel(location, "brief");

  const sharedFilterProps = {
    inputId,
    inputValue,
    selectedCategory,
    categories,
    searchAriaLabel,
    searchPlaceholder,
    onInputChange: handleInputChange,
    onCategoryChange: handleCategoryChange,
    onReset: handleReset,
    getCategoryValue,
    inputClassName,
    selectTriggerClassName,
  };

  return (
    <div className="bg-slate-50/40 min-h-screen">
      <BrowseResultsPanel
        items={items}
        total={total}
        sort={sort}
        view={view}
        loading={loading}
        error={error}
        hasMore={hasMore}
        query={query}
        categoryName={categoryName}
        locationLabel={locationLabel}
        sidebarNode={
          <BrowseFilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            onReset={handleReset}
            activeFilterCount={activeFilterCount}
          />
        }
        filterNode={
          <BrowseFiltersHeaderTrigger
            {...sharedFilterProps}
            activeFilterCount={activeFilterCount}
          />
        }
        activeFilterCount={activeFilterCount}
        activeFilterBadges={activeFilterBadges}
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
