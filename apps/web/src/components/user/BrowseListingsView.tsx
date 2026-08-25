"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const deviceConditionParam = searchParams.get("condition") || searchParams.get("deviceCondition") || "";

  const minPrice = minPriceParam ? Number.parseInt(minPriceParam, 10) : undefined;
  const maxPrice = maxPriceParam ? Number.parseInt(maxPriceParam, 10) : undefined;

  const updateFiltersInUrl = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === "all") {
          current.delete(key);
        } else {
          current.set(key, String(value));
        }
      });
      const search = current.toString();
      const queryStr = search ? `?${search}` : "";
      router.push(`${window.location.pathname}${queryStr}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handlePriceChange = useCallback(
    (min?: number, max?: number) => {
      updateFiltersInUrl({ minPrice: min, maxPrice: max });
    },
    [updateFiltersInUrl]
  );

  const handleConditionChange = useCallback(
    (cond: string) => {
      updateFiltersInUrl({ condition: cond });
    },
    [updateFiltersInUrl]
  );

  const selectedCategoryObj = categories.find((c: Category) =>
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
    minPrice,
    maxPrice,
    onPriceChange: handlePriceChange,
    deviceCondition: deviceConditionParam,
    onDeviceConditionChange: handleConditionChange,
  };

  return (
    <div className="bg-slate-50/40 pb-6">
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
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            deviceCondition={deviceConditionParam}
            onDeviceConditionChange={handleConditionChange}
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
