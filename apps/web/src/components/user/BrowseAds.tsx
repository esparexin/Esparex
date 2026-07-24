"use client";


import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageOpen, RefreshCw, BellPlus } from "lucide-react";

import { type ListingFilters, type Listing, type ListingPageResult } from "@/lib/api/user/listings";
import { getCategories } from "@/lib/api/user/categories";
import type { Category } from "@/lib/api/user/categories";
import { useAdsListQuery } from "@/hooks/queries/useListingsQuery";

import { AdCardGrid, AdCardList } from "@/components/user/ad-card";
import { Breadcrumbs } from "@/components/user/Breadcrumbs";
import { Button } from "@esparex/ui";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildBrowseBrandOptions,
  type BrowseBrandOption,
  resolveBrowseBrandSelection,
  resolveBrowseCategorySelection,
} from "@/lib/browse/browseFilterNormalization";
import { useLocationData } from "@/context/LocationContext";
import {
  getSearchLocationLabel,
  sanitizeLocationLabel,
} from "@/lib/location/locationLabels";
import {
  shouldUseGeoRadiusLocation,
  isUserSelectedLocation,
  shouldApplyLocationFilter,
} from "@/lib/location/queryMode";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";

import { usePersistedBrowseView } from "@/components/user/browseViewPreference";
import { appendUniqueBrowseItems } from "@/lib/browse/appendUniqueBrowseItems";

import { useFilterState, DEFAULT_PRICE_RANGE } from "./hooks/useFilterState";
import { useUrlSync } from "./hooks/useUrlSync";
import { useFilterToQuery } from "./hooks/useFilterToQuery";
import { useBrowseEmptyState, buildPriceSummary } from "./hooks/useBrowseEmptyState";

const PAGE_SIZE = 20;

import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResultsHeader } from "@/components/search/SearchResultsHeader";

let categoriesRequest: Promise<Category[]> | null = null;

const loadCategories = async (): Promise<Category[]> => {
  if (!categoriesRequest) {
    categoriesRequest = getCategories().catch(() => []);
  }
  return categoriesRequest;
};

interface BrowseAdsProps {
  initialSearchQuery?: string;
  initialCategory?: string;
  initialResults?: ListingPageResult;
  initialCategories?: Category[];
}

export function BrowseAds({
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
}: BrowseAdsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location, isLoaded } = useLocationData();
  const routeParams = useMemo(() => parsePublicBrowseParams(searchParams), [searchParams]);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const {
    query, setQuery,
    selectedCategory, setSelectedCategory,
    priceRange, setPriceRange,
    selectedBrands, setSelectedBrands,
    radiusKm, setRadiusKm,
    categoryFilters, setCategoryFilters,
    sort, setSort,
    page, setPage,
    handleReset
  } = useFilterState(routeParams, initialSearchQuery, initialCategory);
  
  const [view, setView] = usePersistedBrowseView("grid");

  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [availableBrands, setAvailableBrands] = useState<BrowseBrandOption[]>([]);




  // ── Load categories once ─────────────────────────────────────────────────────
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      categoriesRequest = Promise.resolve(initialCategories);
      return;
    }

    let cancelled = false;

    void loadCategories().then((data) => {
      if (!cancelled) {
        setCategories(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialCategories]);

  // ── Query Hook Integration ───────────────────────────────────────────────────
  const urlLocationId = routeParams.locationId ?? "";
  const urlLocationLabel = sanitizeLocationLabel(routeParams.location) ?? "";
  const canonicalUrlLocationLabel = urlLocationId ? urlLocationLabel : "";
  const urlModelId = routeParams.modelId ?? "";
  const globalLocationLabel = useMemo(() => getSearchLocationLabel(location), [location]);
  const shouldUseContextGeoRadius = useMemo(
    () => !urlLocationId && isUserSelectedLocation(location) && shouldUseGeoRadiusLocation(location),
    [location, urlLocationId]
  );
  const showRadiusFilter = urlLocationId ? false : shouldUseContextGeoRadius;

  const filters: ListingFilters = useFilterToQuery(
    query, selectedCategory, categories, selectedBrands,
    availableBrands,
    urlModelId, priceRange, urlLocationId,
    location, shouldUseContextGeoRadius, radiusKm, sort, page
  );

  const hasLocationFilter = useMemo(
    () => shouldApplyLocationFilter(location, urlLocationId),
    [location, urlLocationId]
  );

  const shouldUseInitialResults =
    Boolean(initialResults) &&
    page === 1 &&
    sort === "newest" &&
    query.trim() === initialSearchQuery.trim() &&
    (selectedCategory ?? null) === (initialCategory ?? null) &&
    selectedBrands.length === 0 &&
    priceRange[0] === DEFAULT_PRICE_RANGE[0] &&
    priceRange[1] === DEFAULT_PRICE_RANGE[1] &&
    radiusKm === 50 &&
    Object.keys(categoryFilters).length === 0 &&
    !hasLocationFilter;

  const { data, isLoading, isFetching, error, refetch } = useAdsListQuery(filters, {
    enabled: isLoaded,
    initialData: shouldUseInitialResults ? initialResults : undefined,
  });

  const pageAds = useMemo(() => data?.data ?? [], [data]);
  useEffect(() => {
    if (page !== 1) return;
    const timer = setTimeout(() => {
      setAvailableBrands(buildBrowseBrandOptions(pageAds));
    }, 0);
    return () => clearTimeout(timer);
  }, [page, pageAds]);

  // displayAds is derived from the query result — no need for separate state.
  // On page 1 we reset; on subsequent pages we append unique items.
  const displayAds = useMemo(
    () => (page === 1 ? pageAds : appendUniqueBrowseItems([] as Listing[], pageAds)),
    [page, pageAds]
  );

  const total = data?.pagination.total ?? (displayAds.length > 0 ? displayAds.length : 0);
  const hasMore =
    typeof data?.pagination.hasMore === "boolean"
      ? data.pagination.hasMore
      : total > page * PAGE_SIZE;
  const {
    activeFilterCount, isEmptyState,
    emptyStateTitle, emptyStateDescription, suggestions, desktopShellClassName
  } = useBrowseEmptyState(
    selectedCategory, categories, availableBrands, canonicalUrlLocationLabel, location,
    query, priceRange, urlLocationId, globalLocationLabel,
    selectedBrands, showRadiusFilter, radiusKm, sort,
    isLoading, error, displayAds
  );

  useEffect(() => {
    if (availableBrands.length === 0 || selectedBrands.length === 0) return;
    const normalizedBrandSelection = resolveBrowseBrandSelection(selectedBrands, availableBrands);
    if (normalizedBrandSelection.join(",") !== selectedBrands.join(",")) {
      void (async () => { setSelectedBrands(normalizedBrandSelection); })();
    }
  }, [availableBrands, selectedBrands, setSelectedBrands]);

  // ── Trigger fetch when filters change (reset to page 1) ─────────────────
  useEffect(() => {
    void (async () => { setPage(1); })();
  }, [query, selectedCategory, selectedBrands, priceRange, sort, radiusKm, setPage]);

  // ── Sync URL params → state ─────────────────────────────────────────────────
  useUrlSync(
    routeParams, router,
    query, setQuery,
    selectedCategory, setSelectedCategory,
    priceRange, setPriceRange,
    selectedBrands, setSelectedBrands,
    radiusKm, setRadiusKm,
    sort, setSort,
    page, setPage,
    showRadiusFilter, urlModelId, urlLocationId, canonicalUrlLocationLabel
  );

  // ── Load More ────────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    startTransition(() => {
      setPage((prev: number) => prev + 1);
    });
  }, [setPage]);

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  const gridSkeleton = (
    <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  const handleSetSelectedCategory = useCallback((val: string | null) => {
    setSelectedCategory(val);
  }, [setSelectedCategory]);

  const categoryHierarchy = useMemo(() => {
    if (!selectedCategory || categories.length === 0) return [];
    const current = categories.find(
      (c) => c.id === selectedCategory || c.slug === selectedCategory.toLowerCase()
    );
    if (!current) return [];

    const path = [current];
    let parentId = current.parentId;
    while (parentId) {
      const parent = categories.find((c) => c.id === parentId);
      if (!parent) break;
      path.unshift(parent);
      parentId = parent.parentId;
    }
    return path;
  }, [selectedCategory, categories]);

  const currentCategoryName = useMemo(() => {
    if (!selectedCategory) return null;
    return resolveBrowseCategorySelection(selectedCategory, categories).label ?? null;
  }, [selectedCategory, categories]);

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: "Home", onClick: () => router.push("/") }];
    
    // Add "Categories" segment
    items.push({ label: "Categories", onClick: () => router.push("/search") });

    // Add actual hierarchy
    categoryHierarchy.forEach((cat) => {
      items.push({
        label: cat.displayName || cat.name,
        onClick: () => router.push(`/category/${cat.slug}`),
      });
    });

    return items;
  }, [categoryHierarchy, router]);

  const handleRefetch = useCallback(() => { void refetch(); }, [refetch]);

  const filterProps = {
    selectedCategory,
    setSelectedCategory: handleSetSelectedCategory,
    priceRange,
    setPriceRange,
    selectedBrands,
    setSelectedBrands,
    categories,
    availableBrands,
    categoryFilters,
    setCategoryFilters,
    radiusKm,
    setRadiusKm,
    showRadiusFilter,
    onReset: handleReset,
    activeFilterCount,
    desktopShellClassName,
  };

  return (
    <div className="w-full">
      {breadcrumbItems.length > 2 && (
        <Breadcrumbs items={breadcrumbItems} />
      )}
      <section data-primary className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Single SearchFilters — renders sidebar on desktop, drawer trigger on mobile ── */}
            <SearchFilters {...filterProps} />

            {/* ── Results Column ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Results header: count + sort + view toggle */}
              <SearchResultsHeader
                total={isLoading && displayAds.length === 0 ? 0 : total}
                sort={sort}
                view={view}
                onSortChange={setSort}
                onViewChange={setView}
                activeFilterCount={activeFilterCount}
                categoryName={currentCategoryName}
              />

              {/* ── Active Filter Chips ────────────────────────────────────── */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 items-center py-2 border-b border-slate-100">
                  {query && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                      Search: &quot;{query}&quot;
                      <button onClick={() => setQuery("")} className="hover:text-red-500 font-bold ml-0.5" aria-label="Clear search">✕</button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-100">
                      {currentCategoryName}
                      <button onClick={() => setSelectedCategory(null)} className="hover:text-red-500 font-bold ml-0.5" aria-label="Clear category">✕</button>
                    </span>
                  )}
                  {selectedBrands.map((brandId) => {
                    const brandName = availableBrands.find(b => b.value === brandId)?.label || brandId;
                    return (
                      <span key={brandId} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-100">
                        {brandName}
                        <button onClick={() => setSelectedBrands(prev => prev.filter(b => b !== brandId))} className="hover:text-red-500 font-bold ml-0.5" aria-label={`Clear brand ${brandName}`}>✕</button>
                      </span>
                    );
                  })}
                  {(priceRange[0] > 0 || priceRange[1] < DEFAULT_PRICE_RANGE[1]) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100">
                      {buildPriceSummary(priceRange)}
                      <button onClick={() => setPriceRange(DEFAULT_PRICE_RANGE)} className="hover:text-red-500 font-bold ml-0.5" aria-label="Clear price filter">✕</button>
                    </span>
                  )}
                  {showRadiusFilter && radiusKm !== 50 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-100">
                      Within {radiusKm} km
                      <button onClick={() => setRadiusKm(50)} className="hover:text-red-500 font-bold ml-0.5" aria-label="Clear radius filter">✕</button>
                    </span>
                  )}
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline ml-2"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* ── Error state ──────────────────────────────────────────── */}
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                  <p className="text-red-600 font-medium mb-3">
                    {error instanceof Error ? error.message : "Failed to load listings. Please try again."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefetch}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* ── Loading skeleton (initial load only) ─────────────────── */}
              {isLoading && displayAds.length === 0 && !error && gridSkeleton}

              {/* ── Empty state ──────────────────────────────────────────── */}
              {isEmptyState && (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-4">
                    <PackageOpen className="h-10 w-10 text-foreground-subtle" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground capitalize">
                    {emptyStateTitle}
                  </h3>
                  <p className="mb-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {emptyStateDescription}
                  </p>
                  {suggestions && suggestions.length > 0 && (
                    <div className="mb-6 text-left max-w-sm mx-auto">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Try:</p>
                      <ul className="space-y-1.5 text-sm text-slate-600">
                        {suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {activeFilterCount > 0 ? (
                      <Button variant="outline" onClick={handleReset}>
                        Clear Filters
                      </Button>
                    ) : null}
                    {query && (
                      <Button
                        asChild
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <a href="/account/alerts">
                          <BellPlus className="h-4 w-4" />
                          Get Notified When Available
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

            {/* ── Ads Grid / List ──────────────────────────────────────── */}
            {displayAds.length > 0 && (
              <div
                className={
                  view === "list"
                    ? "flex flex-col gap-3"
                    : "grid grid-cols-1 min-[375px]:grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
                }
              >
                {displayAds.map((ad: Listing, index: number) =>
                  view === "list" ? (
                    <AdCardList
                      key={ad.id}
                      ad={ad}
                      href={buildPublicListingDetailRoute({
                        id: ad.id,
                        listingType: ad.listingType,
                        seoSlug: ad.seoSlug,
                        title: ad.title,
                      })}
                      priority={index < 4}
                    />
                  ) : (
                    <AdCardGrid
                      key={ad.id}
                      ad={ad}
                      href={buildPublicListingDetailRoute({
                        id: ad.id,
                        listingType: ad.listingType,
                        seoSlug: ad.seoSlug,
                        title: ad.title,
                      })}
                      priority={index < 4}
                    />
                  )
                )}
              </div>
            )}

            {/* ── Load More ────────────────────────────────────────────── */}
            {hasMore && !isFetching && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  className="min-w-[180px]"
                >
                  Load More
                </Button>
              </div>
            )}

            {/* ── Inline load-more skeleton (pagination) ───────────────── */}
            {isFetching && displayAds.length > 0 && (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-5 w-5 animate-spin text-foreground-subtle" />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
