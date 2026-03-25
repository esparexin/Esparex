"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getCategories, type Category } from "@/lib/api/user/categories";
import { useLocationState, type LocationData } from "@/context/LocationContext";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import logger from "@/lib/logger";
import type { SortOption } from "@/components/search/SearchResultsHeader";

type BrowsePageResult<T> = {
  data: T[];
  pagination: {
    total?: number;
    hasMore?: boolean;
  };
};

interface BrowseListingsControllerConfig<TItem, TFilters> {
  routePath: string;
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
  }) => TFilters;
  fetchPage: (filters: TFilters) => Promise<BrowsePageResult<TItem>>;
}

export function useBrowseListingsController<TItem, TFilters>({
  routePath,
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

  const [query, setQuery] = useState(searchParams.get("q") ?? initialSearchQuery);
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") ?? initialCategory ?? ""
  );
  const [sort, setSort] = useState<SortOption>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<TItem[]>(initialResults?.data ?? []);
  const [total, setTotal] = useState(initialResults?.pagination.total ?? 0);
  const [hasMore, setHasMore] = useState(initialResults?.pagination.hasMore ?? false);
  const [loading, setLoading] = useState(!initialResults);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedInitialFetchRef = useRef(false);

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

  const hasLocationFilter = useMemo(() => {
    const latitude = getLatitude(location);
    const longitude = getLongitude(location);
    return Boolean(location.locationId) || (latitude != null && longitude != null);
  }, [location]);

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
    [buildFilters, fetchPage, loadErrorMessage, location, logScope, page, pageSize, query, selectedCategory]
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
  }, [fetchItems, isLoaded, query, selectedCategory, shouldUseInitialResults]);

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

  const replaceQueryUrl = useCallback(
    (nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery.trim()) {
        params.set("q", nextQuery.trim());
      } else {
        params.delete("q");
      }
      const nextUrl = params.toString() ? `${routePath}?${params.toString()}` : routePath;
      router.replace(nextUrl, { scroll: false });
    },
    [routePath, router, searchParams]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        setQuery(value);
        replaceQueryUrl(value);
      }, 350);
    },
    [replaceQueryUrl]
  );

  const handleReset = useCallback(() => {
    startTransition(() => {
      setQuery("");
      setInputValue("");
      setSelectedCategory("");
      setSort("newest");
      setPage(1);
      router.replace(routePath, { scroll: false });
    });
  }, [routePath, router]);

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
    setSort,
    setView,
    handleInputChange,
    handleReset,
    handleLoadMore,
    handleRetry,
  };
}
