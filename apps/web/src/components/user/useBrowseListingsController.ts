/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

const SEARCH_DEBOUNCE_MS = 350;

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Category } from "@/lib/api/user/categories";
import { useLocationData, type LocationData } from "@/context/LocationContext";
import { sanitizeLocationLabel } from "@/lib/location/locationLabels";
import { shouldApplyLocationFilter } from "@/lib/location/queryMode";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import {
  buildPublicBrowseRoute,
  parsePublicBrowseParams,
  resolvePublicBrowseCategory,
  type PublicBrowseType,
} from "@/lib/publicBrowseRoutes";
import { usePersistedBrowseView } from "@/components/user/browseViewPreference";
import { useBrowseAdsData, type BrowsePageResult } from "@/components/user/useBrowseAdsData";
import { useBrowseFilterPipeline } from "@/components/user/useBrowseFilterPipeline";

interface BrowseListingsControllerConfig<TItem, TFilters> {
  browseType: PublicBrowseType;
  initialCategory?: string;
  initialSearchQuery?: string;
  initialResults?: BrowsePageResult<TItem>;
  initialCategories?: Category[];
  pageSize?: number;
  logScope: string;
  loadErrorMessage?: string;
  buildFilters: (args: {
    page: number;
    pageSize: number;
    query: string;
    selectedCategory: string;
    categories: Category[];
    location: LocationData;
    sort: SortOption;
    urlLocationId?: string;
    urlLocationLabel?: string;
    radiusKm?: number;
  }) => TFilters;
  fetchPage: (filters: TFilters) => Promise<BrowsePageResult<TItem>>;
}

export function useBrowseListingsController<TItem, TFilters>({
  browseType,
  initialCategory,
  initialSearchQuery = "",
  initialResults,
  initialCategories,
  pageSize = 20,
  logScope,
  loadErrorMessage = "Failed to load results. Please try again.",
  buildFilters,
  fetchPage,
}: BrowseListingsControllerConfig<TItem, TFilters>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location, isLoaded } = useLocationData();
  const routeParams = parsePublicBrowseParams(searchParams);
  const routeCategory = resolvePublicBrowseCategory(routeParams) ?? "";

  const initialSelectedCategory = routeCategory || initialCategory || "";
  const initialSort = (routeParams.sort as SortOption | undefined) ?? "newest";
  const initialPage = routeParams.page && routeParams.page > 0 ? routeParams.page : 1;

  const [query, setQuery] = useState(routeParams.q ?? initialSearchQuery);
  const [inputValue, setInputValue] = useState(routeParams.q ?? initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [view, setView] = usePersistedBrowseView("grid");
  const [page, setPage] = useState(initialPage);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedInitialFetchRef = useRef(false);
  const urlLocationId = routeParams.locationId ?? "";
  const urlLocationLabel = sanitizeLocationLabel(routeParams.location) ?? "";
  const urlRadiusKm = routeParams.radiusKm;
  const stableLocation = location;
  const categoriesRef = useRef<Category[]>(initialCategories ?? []);

  const constructFilters = useCallback(
    (requestedPage: number) =>
      buildFilters({
        page: requestedPage,
        pageSize,
        query,
        selectedCategory,
        categories: categoriesRef.current,
        location: stableLocation,
        sort,
        urlLocationId: urlLocationId || undefined,
        urlLocationLabel: urlLocationLabel || undefined,
        radiusKm: urlRadiusKm,
      }),
    [buildFilters, pageSize, query, selectedCategory, sort, stableLocation, urlLocationId, urlLocationLabel, urlRadiusKm]
  );

  const {
    items,
    total,
    hasMore,
    loading,
    setLoading,
    error,
    categories,
    loadPageData,
  } = useBrowseAdsData<TItem, TFilters>({
    initialResults,
    initialCategories,
    logScope,
    loadErrorMessage,
    buildFilters: constructFilters,
    fetchPage,
  });

  useEffect(() => {
    if (categories && categories.length > 0) {
      categoriesRef.current = categories;
    }
  }, [categories]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasLocationFilter = useMemo(() => {
    return shouldApplyLocationFilter(stableLocation, urlLocationId);
  }, [stableLocation, urlLocationId]);

  const shouldUseInitialResults = useMemo(
    () =>
      Boolean(initialResults) &&
      page === 1 &&
      query.trim() === initialSearchQuery.trim() &&
      selectedCategory === (initialCategory ?? "") &&
      sort === "newest" &&
      !hasLocationFilter,
    [
      hasLocationFilter,
      initialCategory,
      initialResults,
      initialSearchQuery,
      page,
      query,
      selectedCategory,
      sort,
    ]
  );

  const fetchItems = useCallback(
    async (requestedPage: number) => {
      await loadPageData(requestedPage);
    },
    [loadPageData]
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!skippedInitialFetchRef.current && shouldUseInitialResults) {
      skippedInitialFetchRef.current = true;
      setLoading(false);
      return;
    }
    setPage(1);
    void fetchItems(1);
  }, [fetchItems, isLoaded, setLoading, shouldUseInitialResults]);

  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const urlDeviceCondition = searchParams.get("condition") || searchParams.get("deviceCondition") || "";
  const urlBrandId = searchParams.get("brandId") || "";

  const { activeFilterBadges, activeFilterCount } = useBrowseFilterPipeline({
    query,
    selectedCategory,
    categories,
    location: stableLocation,
    sort,
    urlLocationId,
    urlLocationLabel,
    urlRadiusKm,
    minPrice: minPriceParam ? Number.parseInt(minPriceParam, 10) : undefined,
    maxPrice: maxPriceParam ? Number.parseInt(maxPriceParam, 10) : undefined,
    deviceCondition: urlDeviceCondition,
    brandId: urlBrandId,
  });

  const buildNextUrl = useCallback(
    (overrides: Partial<{ q: string; category: string; sort: SortOption }> = {}) => {
      const hasOverride = (key: keyof typeof overrides) =>
        Object.prototype.hasOwnProperty.call(overrides, key);

      return buildPublicBrowseRoute({
        type: browseType,
        q: hasOverride("q") ? overrides.q : query,
        category: hasOverride("category") ? overrides.category : selectedCategory,
        sort: hasOverride("sort") ? overrides.sort : sort,
        locationId: urlLocationId || undefined,
        location: urlLocationId ? urlLocationLabel || undefined : undefined,
        radiusKm: urlRadiusKm,
      });
    },
    [browseType, query, selectedCategory, sort, urlLocationId, urlLocationLabel, urlRadiusKm]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setQuery(value);
        void router.push(buildNextUrl({ q: value }), { scroll: false });
      }, SEARCH_DEBOUNCE_MS);
    },
    [buildNextUrl, router]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      startTransition(() => {
        setSelectedCategory(value);
        setPage(1);
        void router.push(buildNextUrl({ category: value }), { scroll: false });
      });
    },
    [buildNextUrl, router]
  );

  const handleSortChange = useCallback(
    (value: SortOption) => {
      startTransition(() => {
        setSort(value);
        setPage(1);
        void router.push(buildNextUrl({ sort: value }), { scroll: false });
      });
    },
    [buildNextUrl, router]
  );

  const handleReset = useCallback(() => {
    startTransition(() => {
      setQuery("");
      setInputValue("");
      setSelectedCategory("");
      setSort("newest");
      setPage(1);
      void router.push(buildPublicBrowseRoute({ type: browseType }), { scroll: false });
    });
  }, [browseType, router]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    startTransition(() => {
      setPage(nextPage);
      void fetchItems(nextPage);
    });
  }, [fetchItems, page]);

  const handleRetry = useCallback(() => {
    void fetchItems(1);
  }, [fetchItems]);

  return {
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
    setSelectedCategory,
    handleCategoryChange,
    handleSortChange,
    setView,
    handleInputChange,
    handleReset,
    handleLoadMore,
    handleRetry,
  };
}
