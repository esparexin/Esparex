"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getCategories, type Category } from "@/lib/api/user/categories";
import { useLocationState, type LocationData } from "@/context/LocationContext";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import logger from "@/lib/logger";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import {
  buildPublicBrowseRoute,
  parsePublicBrowseParams,
  type PublicBrowseType,
} from "@/lib/publicBrowseRoutes";

type BrowsePageResult<T> = {
  data: T[];
  pagination: {
    total?: number;
    hasMore?: boolean;
  };
};

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
  const { location, isLoaded } = useLocationState();
  const routeParams = useMemo(() => parsePublicBrowseParams(searchParams), [searchParams]);

  const initialSelectedCategory = routeParams.categoryId ?? routeParams.category ?? initialCategory ?? "";
  const initialSort = (routeParams.sort as SortOption | undefined) ?? "newest";
  const initialPage = routeParams.page && routeParams.page > 0 ? routeParams.page : 1;

  const [query, setQuery] = useState(routeParams.q ?? initialSearchQuery);
  const [inputValue, setInputValue] = useState(routeParams.q ?? initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(initialPage);

  const [items, setItems] = useState<TItem[]>(initialResults?.data ?? []);
  const [total, setTotal] = useState(initialResults?.pagination.total ?? 0);
  const [hasMore, setHasMore] = useState(initialResults?.pagination.hasMore ?? false);
  const [loading, setLoading] = useState(!initialResults);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedInitialFetchRef = useRef(false);
  const urlLocationId = routeParams.locationId ?? "";
  const urlLocationLabel = routeParams.location ?? "";
  const urlRadiusKm = routeParams.radiusKm;

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      return;
    }

    getCategories()
      .then(setCategories)
      .catch(() => {
        /* non-critical */
      });
  }, [initialCategories]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextQuery = routeParams.q ?? "";
    const nextCategory = routeParams.categoryId ?? routeParams.category ?? "";
    const nextSort = (routeParams.sort as SortOption | undefined) ?? "newest";
    const nextPage = routeParams.page && routeParams.page > 0 ? routeParams.page : 1;

    setQuery((current) => (current === nextQuery ? current : nextQuery));
    setInputValue((current) => (current === nextQuery ? current : nextQuery));
    setSelectedCategory((current) => (current === nextCategory ? current : nextCategory));
    setSort((current) => (current === nextSort ? current : nextSort));
    setPage((current) => (current === nextPage ? current : nextPage));
  }, [
    routeParams.category,
    routeParams.categoryId,
    routeParams.page,
    routeParams.q,
    routeParams.sort,
  ]);

  const hasLocationFilter = useMemo(() => {
    const latitude = getLatitude(location);
    const longitude = getLongitude(location);
    return (
      Boolean(urlLocationId || urlLocationLabel || location.locationId) ||
      (latitude != null && longitude != null)
    );
  }, [location, urlLocationId, urlLocationLabel]);

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
    async (overridePage?: number) => {
      setLoading(true);
      setError(null);

      const currentPage = overridePage ?? page;

      try {
        const result = await fetchPage(
          buildFilters({
            page: currentPage,
            pageSize,
            query,
            selectedCategory,
            location,
            sort,
            urlLocationId: urlLocationId || undefined,
            urlLocationLabel: urlLocationLabel || undefined,
            radiusKm: urlRadiusKm,
          })
        );

        setItems((prev) => (currentPage === 1 ? result.data : [...prev, ...result.data]));
        setTotal(result.pagination.total ?? result.data.length);
        setHasMore(result.pagination.hasMore ?? false);
      } catch (fetchError) {
        logger.error(`[${logScope}] fetch failed:`, fetchError);
        setError(loadErrorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      buildFilters,
      fetchPage,
      loadErrorMessage,
      location,
      logScope,
      page,
      pageSize,
      query,
      selectedCategory,
      sort,
      urlLocationId,
      urlLocationLabel,
      urlRadiusKm,
    ]
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
  }, [fetchItems, isLoaded, query, selectedCategory, sort, shouldUseInitialResults, urlLocationId, urlLocationLabel, urlRadiusKm]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!skippedInitialFetchRef.current && shouldUseInitialResults) {
      skippedInitialFetchRef.current = true;
      setLoading(false);
      return;
    }
    setPage(1);
    void fetchItems(1);
  }, [fetchItems, isLoaded, location.coordinates, location.locationId, shouldUseInitialResults]);

  const buildNextUrl = useCallback(
    (
      overrides: Partial<{
        q: string;
        category: string;
        sort: SortOption;
      }> = {}
    ) => {
      const hasOverride = (key: keyof typeof overrides) =>
        Object.prototype.hasOwnProperty.call(overrides, key);

      return buildPublicBrowseRoute({
        type: browseType,
        q: hasOverride("q") ? overrides.q : query,
        category: hasOverride("category") ? overrides.category : selectedCategory,
        sort: hasOverride("sort") ? overrides.sort : sort,
        locationId: urlLocationId || undefined,
        location: urlLocationId ? undefined : urlLocationLabel || undefined,
        radiusKm: urlRadiusKm,
      });
    },
    [browseType, query, selectedCategory, sort, urlLocationId, urlLocationLabel, urlRadiusKm]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        setQuery(value);
        router.replace(buildNextUrl({ q: value }), { scroll: false });
      }, 350);
    },
    [buildNextUrl, router]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      startTransition(() => {
        setSelectedCategory(value);
        setPage(1);
        router.replace(buildNextUrl({ category: value }), { scroll: false });
      });
    },
    [buildNextUrl, router]
  );

  const handleSortChange = useCallback(
    (value: SortOption) => {
      startTransition(() => {
        setSort(value);
        setPage(1);
        router.replace(buildNextUrl({ sort: value }), { scroll: false });
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
      router.replace(buildPublicBrowseRoute({ type: browseType }), { scroll: false });
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
