"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageOpen, RefreshCw, BellPlus } from "lucide-react";

import { type ListingFilters, type Listing, type ListingPageResult } from "@/lib/api/user/listings";
import { getCategories } from "@/lib/api/user/categories";
import type { Category } from "@/lib/api/user/categories";
import { useAdsListQuery } from "@/hooks/queries/useListingsQuery";

import { AdCardGrid, AdCardList } from "@/components/user/ad-card";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationState } from "@/context/LocationContext";
import {
  getSearchLocationLabel,
  sanitizeLocationLabel,
} from "@/lib/location/locationLabels";
import {
  shouldUseGeoRadiusLocation,
} from "@/lib/location/queryMode";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";

import { usePersistedBrowseView } from "@/components/user/browseViewPreference";
import { appendUniqueBrowseItems } from "@/lib/browse/appendUniqueBrowseItems";

import { useFilterState, DEFAULT_PRICE_RANGE } from "./hooks/useFilterState";
import { useUrlSync } from "./hooks/useUrlSync";
import { useFilterToQuery } from "./hooks/useFilterToQuery";
import { useBrowseEmptyState } from "./hooks/useBrowseEmptyState";

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
  const { location, isLoaded } = useLocationState();
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

  // Derived brand list from returned ads for filter sidebar
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

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
  const urlModelId = routeParams.modelId ?? "";
  const globalLocationLabel = useMemo(() => getSearchLocationLabel(location), [location]);
  const shouldUseContextGeoRadius = useMemo(
    () => !urlLocationId && !urlLocationLabel && shouldUseGeoRadiusLocation(location),
    [location, urlLocationId, urlLocationLabel]
  );
  const showRadiusFilter = Boolean(urlLocationId || urlLocationLabel) ? false : shouldUseContextGeoRadius;

  const filters: ListingFilters = useFilterToQuery(
    query, selectedCategory, categories, selectedBrands,
    urlModelId, priceRange, urlLocationId, urlLocationLabel,
    location, shouldUseContextGeoRadius, radiusKm, sort, page
  );

  const hasLocationFilter =
    Boolean(urlLocationId || urlLocationLabel || location.locationId || globalLocationLabel) ||
    (typeof filters.lat === "number" && Number.isFinite(filters.lat)) ||
    (typeof filters.lng === "number" && Number.isFinite(filters.lng));

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
  const [displayAds, setDisplayAds] = useState<Listing[]>(initialResults?.data ?? []);

  useEffect(() => {
    if (!data) return;
    setDisplayAds((current) => (page === 1 ? pageAds : appendUniqueBrowseItems(current, pageAds)));
  }, [data, page, pageAds]);

  const total = data?.pagination.total ?? (displayAds.length > 0 ? displayAds.length : 0);
  const hasMore =
    typeof data?.pagination.hasMore === "boolean"
      ? data.pagination.hasMore
      : total > page * PAGE_SIZE;
  const {
    activeFilterCount, isEmptyState,
    emptyStateTitle, emptyStateDescription, desktopShellClassName
  } = useBrowseEmptyState(
    selectedCategory, categories, urlLocationLabel, location,
    query, priceRange, urlLocationId, globalLocationLabel,
    selectedBrands, showRadiusFilter, radiusKm, sort,
    isLoading, error, displayAds
  );

  // Extract unique brands from results for filter sidebar (page 1)
  useEffect(() => {
    if (page === 1 && pageAds.length > 0) {
      const brands = Array.from(
        new Set(
          pageAds
            .map((ad: Listing) => ad.brand as string | undefined)
            .filter((b): b is string => typeof b === "string" && b.length > 0)
        )
      ) as string[];
      setAvailableBrands(brands);
    }
  }, [page, pageAds]);

  // ── Trigger fetch when filters change (reset to page 1) ─────────────────────
  useEffect(() => {
    setPage(1);
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
    showRadiusFilter, urlModelId, urlLocationId, urlLocationLabel
  );

  // ── Load More ────────────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    startTransition(() => {
      setPage((prev: number) => prev + 1);
    });
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  const GridSkeleton = () => (
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

  const filterProps = {
    selectedCategory,
    setSelectedCategory: (val: string | null) => {
      setSelectedCategory(val);
    },
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
    <div className="bg-slate-50/40">
      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Filters Sidebar ──────────────────────────────────────────── */}
          <div className="hidden lg:block">
            <SearchFilters {...filterProps} />
          </div>

          {/* ── Results Column ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Results header: count + sort + view toggle */}
            <SearchResultsHeader
              total={isLoading && displayAds.length === 0 ? 0 : total}
              sort={sort}
              view={view}
              onSortChange={setSort}
              onViewChange={setView}
              filterNode={<SearchFilters {...filterProps} />}
              activeFilterCount={activeFilterCount}
            />

            {/* ── Error state ──────────────────────────────────────────── */}
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                <p className="text-red-600 font-medium mb-3">
                  {error instanceof Error ? error.message : "Failed to load listings. Please try again."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}

            {/* ── Loading skeleton (initial load only) ─────────────────── */}
            {isLoading && displayAds.length === 0 && !error && <GridSkeleton />}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {isEmptyState && (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4">
                  <PackageOpen className="h-10 w-10 text-foreground-subtle" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {emptyStateTitle}
                </h3>
                <p className="mb-6 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {emptyStateDescription}
                </p>
                {activeFilterCount > 0 && !query && (
                  <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    Try adjusting your criteria or clear your filters to see more results.
                  </p>
                )}
                {query && (
                  <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    No results for "{query}". Try different keywords or clear your filters.
                  </p>
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
                {query && (
                  <p className="mt-4 text-xs text-foreground-subtle max-w-xs">
                    Set a Smart Alert and we&apos;ll notify you when a matching listing is posted.
                  </p>
                )}
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
      </div>
    </div>
  );
}
