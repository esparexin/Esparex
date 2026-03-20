"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PackageOpen, RefreshCw } from "lucide-react";

import { type AdFilters, type Ad, type AdPageResult } from "@/api/user/ads";
import { getCategories } from "@/api/user/categories";
import type { Category } from "@/api/user/categories";
import { useAdsListQuery } from "@/queries";

import { AdCardGrid, AdCardList } from "@/components/user/ad-card";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationState } from "@/context/LocationContext";
import { generateAdSlug } from "@/utils/slug";
import { getLatitude, getLongitude } from "@/lib/location/utils";

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
  initialResults?: AdPageResult;
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

  // ── Filter state (derived from URL params on mount) ──────────────────────────
  const [query, setQuery] = useState(
    searchParams.get("q") ?? initialSearchQuery
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") ?? initialCategory ?? null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(50);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<SortOption>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const [lanes, setLanes] = useState(4);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === "list") {
      setLanes(1);
      return;
    }
    const updateLanes = () => {
      if (window.innerWidth >= 1024) setLanes(4);
      else if (window.innerWidth >= 768) setLanes(3);
      else setLanes(2);
    };
    updateLanes();
    window.addEventListener("resize", updateLanes);
    return () => window.removeEventListener("resize", updateLanes);
  }, [view]);

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

  const filters: AdFilters = useMemo(() => {
    const nextFilters: AdFilters = {
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
    if (priceRange[0] > 0) nextFilters.minPrice = priceRange[0];
    if (priceRange[1] < 200000) nextFilters.maxPrice = priceRange[1];

    if (location) {
      if (location.locationId) {
        nextFilters.locationId = location.locationId;
      }
      if (location.level) {
        nextFilters.level = location.level;
      }
      const lat = getLatitude(location);
      const lng = getLongitude(location);
      if (lat != null && lng != null) {
        nextFilters.lat = lat;
        nextFilters.lng = lng;
        nextFilters.radiusKm = radiusKm;
      } else if (location.city) {
        nextFilters.location = location.city;
      }
    }

    return nextFilters;
  }, [categories, location, page, priceRange, query, radiusKm, selectedBrands, selectedCategory, sort]);

  const hasLocationFilter =
    Boolean(location.locationId || location.city) ||
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

  const rowVirtualizer = useVirtualizer({
    count: ads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (view === "list" ? 180 : 320),
    overscan: 5,
    lanes: view === "list" ? 1 : lanes,
  });

  // Extract unique brands from results for filter sidebar (page 1)
  useEffect(() => {
    if (page === 1 && ads.length > 0) {
      const brands = Array.from(
        new Set(
          ads
            .map((ad: Ad) => ad.brand as string | undefined)
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

  // ── Sync URL params → state on mount ────────────────────────────────────────
  useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    const urlCategory = searchParams.get("category") ?? null;
    if (urlQuery !== query) { setQuery(urlQuery); }
    if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    startTransition(() => {
      setQuery("");
      setSelectedCategory(initialCategory ?? null);
      setPriceRange([0, 200000]);
      setSelectedBrands([]);
      setRadiusKm(50);
      setCategoryFilters({});
      setSort("newest");
      setPage(1);
      router.replace("/search", { scroll: false });
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
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* ── Main Layout ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="flex gap-6 items-start">

          {/* ── Filters Sidebar ──────────────────────────────────────────── */}
          <SearchFilters
            selectedCategory={selectedCategory}
            setSelectedCategory={(val) => {
              setSelectedCategory(val);
              const params = new URLSearchParams(searchParams.toString());
              if (val) params.set("category", val);
              else params.delete("category");
              router.replace(`/search?${params.toString()}`, { scroll: false });
            }}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
            categories={categories}
            availableBrands={availableBrands}
            categoryFilters={categoryFilters}
            setCategoryFilters={setCategoryFilters}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            onReset={handleReset}
          />

          {/* ── Results Column ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Results header: count + sort + view toggle */}
            <SearchResultsHeader
              total={isLoading && ads.length === 0 ? 0 : total}
              sort={sort}
              view={view}
              onSortChange={setSort}
              onViewChange={setView}
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
                <Button variant="outline" onClick={handleReset}>
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* ── Ads Grid / List ──────────────────────────────────────── */}
            {ads.length > 0 && (
              <div ref={parentRef} className="max-h-[800px] overflow-auto custom-scrollbar w-full pb-8">
                <div
                  className={
                    view === "list"
                      ? "flex flex-col gap-3"
                      : "grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
                  }
                >
                  {rowVirtualizer.getVirtualItems().length > 0 && Array.from({ length: rowVirtualizer.getVirtualItems()[0]?.index ?? 0 }).map((_, i) => (
                    <div key={`spacer-before-${i}`} style={{ height: view === 'list' ? 180 : 320 }} />
                  ))}

                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const ad = ads[virtualRow.index];
                    if (!ad) return null;
                    if (view === "list") {
                      return (
                        <AdCardList
                          key={ad.id}
                          ad={ad}
                          href={`/ads/${generateAdSlug(ad.title)}-${ad.id}`}
                        />
                      );
                    }
                    return (
                      <AdCardGrid
                        key={ad.id}
                        ad={ad}
                        href={`/ads/${generateAdSlug(ad.title)}-${ad.id}`}
                        priority={virtualRow.index < 4}
                      />
                    );
                  })}

                  {rowVirtualizer.getVirtualItems().length > 0 && Array.from({ length: Math.max(0, ads.length - 1 - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.index ?? 0)) }).map((_, i) => (
                    <div key={`spacer-after-${i}`} style={{ height: view === 'list' ? 180 : 320 }} />
                  ))}
                </div>
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
