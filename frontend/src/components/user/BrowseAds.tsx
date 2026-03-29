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
import { getLatitude, getLongitude } from "@/lib/location/utils";
import { buildPublicBrowseRoute, parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

const PAGE_SIZE = 20;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

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
    routeParams.minPrice ?? 0,
    routeParams.maxPrice ?? 200000,
  ]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    routeParams.brands ? routeParams.brands.split(",").map((brand) => brand.trim()).filter(Boolean) : []
  );
  const [radiusKm, setRadiusKm] = useState(routeParams.radiusKm ?? 50);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<SortOption>((routeParams.sort as SortOption | undefined) ?? "newest");
  const [view, setView] = useState<"grid" | "list">("grid");
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
  const sortMap: Record<SortOption, string> = {
    relevance: "relevance",
    newest: "createdAt_desc",
    price_low_high: "price_asc",
    price_high_low: "price_desc",
  };
  const urlLocationId = routeParams.locationId ?? "";
  const urlLocationLabel = routeParams.location ?? "";
  const urlModelId = routeParams.modelId ?? "";

  const filters: ListingFilters = useMemo(() => {
    const nextFilters: ListingFilters = {
      status: "live",
      page,
      limit: PAGE_SIZE,
      sortBy: sortMap[sort],
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
    if (priceRange[1] < 200000) nextFilters.maxPrice = priceRange[1];

    if (urlLocationId) {
      nextFilters.locationId = urlLocationId;
      nextFilters.radiusKm = radiusKm;
    } else if (urlLocationLabel) {
      nextFilters.location = urlLocationLabel;
      nextFilters.radiusKm = radiusKm;
    } else if (location) {
      const isRegionLevel = location.level === "state" || location.level === "country";
      const regionLocationLabel =
        location.level === "state"
          ? (location.state || location.city || undefined)
          : location.level === "country"
            ? (location.country || location.state || location.city || undefined)
            : undefined;

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
      } else if (location.city) {
        nextFilters.location = location.city;
      }
    }

    return nextFilters;
  }, [categories, location, page, priceRange, query, radiusKm, selectedBrands, selectedCategory, sort, urlLocationId, urlLocationLabel, urlModelId]);

  const hasLocationFilter =
    Boolean(urlLocationId || urlLocationLabel || location.locationId || location.city) ||
    (typeof filters.lat === "number" && Number.isFinite(filters.lat)) ||
    (typeof filters.lng === "number" && Number.isFinite(filters.lng));

  const shouldUseInitialResults =
    Boolean(initialResults) &&
    page === 1 &&
    sort === "newest" &&
    query.trim() === initialSearchQuery.trim() &&
    (selectedCategory ?? null) === (initialCategory ?? null) &&
    selectedBrands.length === 0 &&
    priceRange[0] === 0 &&
    priceRange[1] === 200000 &&
    radiusKm === 50 &&
    Object.keys(categoryFilters).length === 0 &&
    !hasLocationFilter;

  const { data, isLoading, error, refetch } = useAdsListQuery(filters, {
    enabled: isLoaded,
    initialData: shouldUseInitialResults ? initialResults : undefined,
  });

  const ads = data?.data ?? [];
  const total = data?.pagination.total ?? (ads.length > 0 ? ads.length : 0);
  const hasMore = data?.pagination.hasMore ?? false;

  // Extract unique brands from results for filter sidebar (page 1)
  useEffect(() => {
    if (page === 1 && ads.length > 0) {
      const brands = Array.from(
        new Set(
          ads
            .map((ad: Listing) => ad.brand as string | undefined)
            .filter((b): b is string => typeof b === "string" && b.length > 0)
        )
      ) as string[];
      setAvailableBrands(brands);
    }
  }, [page, ads]);

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
    const nextPriceRange: [number, number] = [routeParams.minPrice ?? 0, routeParams.maxPrice ?? 200000];
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
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 200000 ? priceRange[1] : undefined,
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
      setPriceRange([0, 200000]);
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
  };

  return (
    <div className="min-h-screen bg-slate-50/40">
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
              total={isLoading && ads.length === 0 ? 0 : total}
              sort={sort}
              view={view}
              onSortChange={setSort}
              onViewChange={setView}
              filterNode={<SearchFilters {...filterProps} />}
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
            {isLoading && ads.length === 0 && !error && <GridSkeleton />}

            {/* ── Empty state ──────────────────────────────────────────── */}
            {!isLoading && !error && ads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-slate-100 p-6 mb-4">
                  <PackageOpen className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No listings found
                </h3>
                <p className="text-slate-500 max-w-xs mb-6">
                  {query
                    ? `No results for "${query}". Try different keywords or remove filters.`
                    : "No listings match your current filters."}
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
            {ads.length > 0 && (
              <div
                className={
                  view === "list"
                    ? "flex flex-col gap-3"
                    : "grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
                }
              >
                {ads.map((ad: Listing, index: number) =>
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
            {hasMore && !isLoading && (
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
            {isLoading && ads.length > 0 && (
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
