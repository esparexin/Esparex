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
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationState } from "@/context/LocationContext";
import {
  getDisplayLocationLabel,
  getSearchLocationLabel,
  sanitizeLocationLabel,
} from "@/lib/location/locationLabels";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import { buildPublicBrowseRoute, parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import {
  PUBLIC_BROWSE_SORT_LABELS,
  PUBLIC_BROWSE_SORT_MAP,
} from "@/lib/publicBrowseSort";
import { usePersistedBrowseView } from "@/components/user/browseViewPreference";
import { appendUniqueBrowseItems } from "@/lib/browse/appendUniqueBrowseItems";

const PAGE_SIZE = 20;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const DEFAULT_PRICE_RANGE: [number, number] = [0, 200000];
const EMPTY_FILTER_SHELL_CLASS_NAME =
  "w-64 shrink-0 h-fit sticky top-[6.25rem] rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-none backdrop-blur-sm";

const formatCurrency = (value: number) => `Rs ${value.toLocaleString()}`;

const buildPriceSummary = (priceRange: [number, number]) => {
  const [minPrice, maxPrice] = priceRange;
  if (minPrice <= DEFAULT_PRICE_RANGE[0] && maxPrice >= DEFAULT_PRICE_RANGE[1]) {
    return null;
  }
  if (minPrice > DEFAULT_PRICE_RANGE[0] && maxPrice < DEFAULT_PRICE_RANGE[1]) {
    return `${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}`;
  }
  if (minPrice > DEFAULT_PRICE_RANGE[0]) {
    return `From ${formatCurrency(minPrice)}`;
  }
  return `Up to ${formatCurrency(maxPrice)}`;
};

const SearchFilters = dynamic(
  () => import("@/components/search/SearchFilters").then((mod) => mod.SearchFilters),
  {
    ssr: true,
    loading: () => <div className="hidden w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 lg:block" />,
  }
);
const SearchResultsHeader = dynamic(
  () => import("@/components/search/SearchResultsHeader").then((mod) => mod.SearchResultsHeader),
  {
    ssr: true,
    loading: () => <div className="sticky top-0 z-20 h-[70px] rounded-xl border border-slate-100 bg-white/80" />,
  }
);

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

  // ── Filter state (derived from URL params on mount) ──────────────────────────
  const [query, setQuery] = useState(
    routeParams.q ?? initialSearchQuery
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    routeParams.categoryId ?? routeParams.category ?? initialCategory ?? null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    routeParams.minPrice ?? DEFAULT_PRICE_RANGE[0],
    routeParams.maxPrice ?? DEFAULT_PRICE_RANGE[1],
  ]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    routeParams.brands ? routeParams.brands.split(",").map((brand) => brand.trim()).filter(Boolean) : []
  );
  const [radiusKm, setRadiusKm] = useState(routeParams.radiusKm ?? 50);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<SortOption>((routeParams.sort as SortOption | undefined) ?? "newest");
  const [view, setView] = usePersistedBrowseView("grid");
  const [page, setPage] = useState(routeParams.page && routeParams.page > 0 ? routeParams.page : 1);

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

  const filters: ListingFilters = useMemo(() => {
    const nextFilters: ListingFilters = {
      status: "live",
      page,
      limit: PAGE_SIZE,
      sortBy: PUBLIC_BROWSE_SORT_MAP[sort],
    };

    if (query.trim()) nextFilters.search = query.trim();
    if (selectedCategory) {
      const normalizedCategory = selectedCategory.trim();
      const categoryById = categories.find((category) => category.id === normalizedCategory);
      const categoryBySlug = categories.find((category) => category.slug === normalizedCategory);
      const resolvedCategoryId = categoryById?.id || categoryBySlug?.id;

      if (resolvedCategoryId && OBJECT_ID_PATTERN.test(resolvedCategoryId)) {
        nextFilters.categoryId = resolvedCategoryId;
      } else if (OBJECT_ID_PATTERN.test(normalizedCategory)) {
        nextFilters.categoryId = normalizedCategory;
      } else {
        nextFilters.category = normalizedCategory;
      }
    }
    if (selectedBrands.length > 0) nextFilters.brandId = selectedBrands.join(",");
    if (urlModelId) nextFilters.modelId = urlModelId;
    if (priceRange[0] > 0) nextFilters.minPrice = priceRange[0];
    if (priceRange[1] < DEFAULT_PRICE_RANGE[1]) nextFilters.maxPrice = priceRange[1];

    if (urlLocationId) {
      nextFilters.locationId = urlLocationId;
      nextFilters.radiusKm = radiusKm;
    } else if (urlLocationLabel) {
      nextFilters.location = urlLocationLabel;
      nextFilters.radiusKm = radiusKm;
    } else if (location) {
      const isRegionLevel = location.level === "state" || location.level === "country";
      const regionLocationLabel = getSearchLocationLabel(location);

      if (location.locationId) {
        nextFilters.locationId = location.locationId;
      }
      if (location.level) {
        nextFilters.level = location.level;
      }
      const lat = getLatitude(location);
      const lng = getLongitude(location);
      if (!isRegionLevel && lat != null && lng != null) {
        nextFilters.lat = lat;
        nextFilters.lng = lng;
        nextFilters.radiusKm = radiusKm;
      } else if (regionLocationLabel) {
        nextFilters.location = regionLocationLabel;
      } else if (regionLocationLabel) {
        nextFilters.location = regionLocationLabel;
      }
    }

    return nextFilters;
  }, [categories, location, page, priceRange, query, radiusKm, selectedBrands, selectedCategory, sort, urlLocationId, urlLocationLabel, urlModelId]);

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

  const pageAds = data?.data ?? [];
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
  const resolvedCategoryLabel = useMemo(() => {
    if (!selectedCategory) return null;

    const normalizedCategory = selectedCategory.trim();
    const matchedCategory = categories.find(
      (category) => category.id === normalizedCategory || category.slug === normalizedCategory
    );

    if (matchedCategory?.name) return matchedCategory.name;
    if (matchedCategory?.slug) return matchedCategory.slug;
    return OBJECT_ID_PATTERN.test(normalizedCategory) ? null : normalizedCategory;
  }, [categories, selectedCategory]);

  const activeLocationLabel = useMemo(() => {
    if (urlLocationLabel) return urlLocationLabel;
    if (location.source === "default") return null;
    return getDisplayLocationLabel(location) || null;
  }, [location, urlLocationLabel]);

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];
    const trimmedQuery = query.trim();
    const priceSummary = buildPriceSummary(priceRange);
    const hasActiveLocation = Boolean(urlLocationId || urlLocationLabel || location.locationId || globalLocationLabel);

    if (trimmedQuery) badges.push(`Search: "${trimmedQuery}"`);
    if (resolvedCategoryLabel) badges.push(`Category: ${resolvedCategoryLabel}`);

    if (selectedBrands.length === 1) {
      badges.push(`Brand: ${selectedBrands[0]}`);
    } else if (selectedBrands.length > 1) {
      badges.push(`${selectedBrands.length} brands`);
    }

    if (priceSummary) badges.push(priceSummary);
    if (activeLocationLabel) badges.push(`Location: ${activeLocationLabel}`);
    if (hasActiveLocation && radiusKm !== 50) badges.push(`Within ${radiusKm} km`);
    if (sort !== "newest") badges.push(`Sort: ${PUBLIC_BROWSE_SORT_LABELS[sort]}`);

    return badges;
  }, [activeLocationLabel, globalLocationLabel, location.locationId, priceRange, query, radiusKm, resolvedCategoryLabel, selectedBrands, sort, urlLocationId, urlLocationLabel]);

  const activeFilterCount = activeFilterBadges.length;
  const isEmptyState = !isLoading && !error && displayAds.length === 0;
  const emptyStateTitle = activeFilterCount > 0 ? "No listings match these filters" : "No listings available right now";
  const emptyStateDescription = activeFilterCount > 0
    ? "Try widening the price, radius, or category filters below. You can also clear everything and start again."
    : "There are no live ads in this view yet. Check back soon or widen your location once sellers publish new listings.";
  const desktopShellClassName = isEmptyState ? EMPTY_FILTER_SHELL_CLASS_NAME : undefined;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCategory, selectedBrands, priceRange, sort, radiusKm]);

  // ── Sync URL params → state ─────────────────────────────────────────────────
  useEffect(() => {
    const nextQuery = routeParams.q ?? "";
    const nextCategory = routeParams.categoryId ?? routeParams.category ?? null;
    const nextSort = (routeParams.sort as SortOption | undefined) ?? "newest";
    const nextPriceRange: [number, number] = [
      routeParams.minPrice ?? DEFAULT_PRICE_RANGE[0],
      routeParams.maxPrice ?? DEFAULT_PRICE_RANGE[1],
    ];
    const nextBrands = routeParams.brands
      ? routeParams.brands.split(",").map((brand) => brand.trim()).filter(Boolean)
      : [];
    const nextRadius = routeParams.radiusKm ?? 50;
    const nextPage = routeParams.page && routeParams.page > 0 ? routeParams.page : 1;

    setQuery((current) => (current === nextQuery ? current : nextQuery));
    setSelectedCategory((current) => (current === nextCategory ? current : nextCategory));
    setPriceRange((current) =>
      current[0] === nextPriceRange[0] && current[1] === nextPriceRange[1] ? current : nextPriceRange
    );
    setSelectedBrands((current) =>
      current.join(",") === nextBrands.join(",") ? current : nextBrands
    );
    setRadiusKm((current) => (current === nextRadius ? current : nextRadius));
    setSort((current) => (current === nextSort ? current : nextSort));
    setPage((current) => (current === nextPage ? current : nextPage));
  }, [
    routeParams.brands,
    routeParams.category,
    routeParams.categoryId,
    routeParams.maxPrice,
    routeParams.minPrice,
    routeParams.page,
    routeParams.q,
    routeParams.radiusKm,
    routeParams.sort,
  ]);

  const canonicalBrowseRoute = useMemo(
    () =>
      buildPublicBrowseRoute({
        type: "ad",
        q: query.trim() || undefined,
        category: selectedCategory ?? undefined,
        sort,
        minPrice: priceRange[0] > DEFAULT_PRICE_RANGE[0] ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < DEFAULT_PRICE_RANGE[1] ? priceRange[1] : undefined,
        brands: selectedBrands.length > 0 ? selectedBrands.join(",") : undefined,
        modelId: urlModelId || undefined,
        locationId: urlLocationId || undefined,
        location: urlLocationId ? undefined : urlLocationLabel || undefined,
        radiusKm: urlLocationId || urlLocationLabel ? radiusKm : undefined,
      }),
    [priceRange, query, radiusKm, selectedBrands, selectedCategory, sort, urlLocationId, urlLocationLabel, urlModelId]
  );

  const currentBrowseRoute = useMemo(
    () =>
      buildPublicBrowseRoute({
        type: routeParams.type,
        q: routeParams.q,
        category: routeParams.category,
        categoryId: routeParams.categoryId,
        modelId: routeParams.modelId,
        sort: routeParams.sort,
        minPrice: routeParams.minPrice,
        maxPrice: routeParams.maxPrice,
        location: routeParams.location,
        locationId: routeParams.locationId,
        brands: routeParams.brands,
        radiusKm: routeParams.radiusKm,
      }),
    [routeParams]
  );

  useEffect(() => {
    if (page !== 1) return;
    if (currentBrowseRoute !== canonicalBrowseRoute) {
      router.replace(canonicalBrowseRoute, { scroll: false });
    }
  }, [canonicalBrowseRoute, currentBrowseRoute, page, router]);

  const handleReset = () => {
    startTransition(() => {
      setQuery("");
      setSelectedCategory(null);
      setPriceRange(DEFAULT_PRICE_RANGE);
      setSelectedBrands([]);
      setRadiusKm(50);
      setCategoryFilters({});
      setSort("newest");
      setPage(1);
      router.replace(buildPublicBrowseRoute({ type: "ad" }), { scroll: false });
    });
  };

  // ── Load More ────────────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    startTransition(() => {
      setPage(prev => prev + 1);
    });
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  const GridSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4">
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
              <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:min-h-[400px] sm:px-10 sm:py-14">
                <div className="mb-4 rounded-full bg-slate-100 p-6">
                  <PackageOpen className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  {emptyStateTitle}
                </h3>
                <p className="mb-6 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                  {emptyStateDescription}
                </p>
                {activeFilterBadges.length > 0 && (
                  <div className="mb-6 flex max-w-2xl flex-wrap justify-center gap-2">
                    {activeFilterBadges.map((badge) => (
                      <span
                        key={badge}
                        className="max-w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mb-6 max-w-sm text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Sorted by {PUBLIC_BROWSE_SORT_LABELS[sort]}
                </p>
                <p className="text-slate-500 max-w-xs mb-6">
                  {query
                    ? `No results for "${query}". Try different keywords or remove filters.`
                    : activeFilterCount > 0
                      ? "Remove one or two filters to broaden the results."
                      : "Live ads will appear here as soon as sellers publish them."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={handleReset}>
                    Clear All Filters
                  </Button>
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
                  <p className="mt-4 text-xs text-slate-400 max-w-xs">
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
                    : "grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
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
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
