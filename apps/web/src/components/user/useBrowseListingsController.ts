/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

const SEARCH_DEBOUNCE_MS = 350;

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getCategories, type Category } from "@/lib/api/user/categories";
import { useLocationData, type LocationData } from "@/context/LocationContext";
import {
  getDisplayLocationLabel,
  sanitizeLocationLabel,
} from "@/lib/location/locationLabels";
import { getLatitude, getLongitude } from "@esparex/shared";
import logger from "@/lib/logger";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import {
  buildPublicBrowseRoute,
  parsePublicBrowseParams,
  resolvePublicBrowseCategory,
  type PublicBrowseType,
} from "@/lib/publicBrowseRoutes";
import { resolveBrowseCategorySelection } from "@/lib/browse/browseFilterNormalization";
import { PUBLIC_BROWSE_SORT_LABELS } from "@/lib/publicBrowseSort";
import { usePersistedBrowseView } from "@/lib/browse/browseViewPreference";
import { appendUniqueBrowseItems } from "@/lib/browse/appendUniqueBrowseItems";

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

  const [items, setItems] = useState<TItem[]>(initialResults?.data ?? []);
  const [total, setTotal] = useState(initialResults?.pagination.total ?? 0);
  const [hasMore, setHasMore] = useState(initialResults?.pagination.hasMore ?? false);
  const [loading, setLoading] = useState(!initialResults);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedInitialFetchRef = useRef(false);
  const urlLocationId = routeParams.locationId ?? "";
  const urlLocationLabel = sanitizeLocationLabel(routeParams.location) ?? "";
  const urlRadiusKm = routeParams.radiusKm;
  const locationLatitude = getLatitude(location);
  const locationLongitude = getLongitude(location);
  const stableLocation = location;

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
    return (
      Boolean(urlLocationId || stableLocation.locationId) ||
      (locationLatitude != undefined && locationLongitude != undefined)
    );
  }, [locationLatitude, locationLongitude, stableLocation.locationId, urlLocationId]);

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
      setLoading(true);
      setError(null);

      try {
        const result = await fetchPage(
          buildFilters({
            page: requestedPage,
            pageSize,
            query,
            selectedCategory,
            categories,
            location: stableLocation,
            sort,
            urlLocationId: urlLocationId || undefined,
            urlLocationLabel: urlLocationLabel || undefined,
            radiusKm: urlRadiusKm,
          })
        );

        setItems((prev) => (requestedPage === 1 ? result.data : appendUniqueBrowseItems(prev, result.data)));
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
      pageSize,
      query,
      selectedCategory,
      categories,
      sort,
      stableLocation,
      loadErrorMessage,
      logScope,
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
  }, [fetchItems, isLoaded, shouldUseInitialResults]);

  const resolvedCategoryLabel = useMemo(() => {
    return resolveBrowseCategorySelection(selectedCategory, categories).label ?? null;
  }, [categories, selectedCategory]);

  const activeLocationLabel = useMemo(() => {
    if (urlLocationId && urlLocationLabel) return urlLocationLabel;
    if (stableLocation.source === "default") return null;
    return getDisplayLocationLabel(stableLocation) || null;
  }, [stableLocation, urlLocationId, urlLocationLabel]);

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];
    const trimmedQuery = query.trim();

    if (trimmedQuery) badges.push(`Search: "${trimmedQuery}"`);
    if (resolvedCategoryLabel) badges.push(`Category: ${resolvedCategoryLabel}`);
    if (activeLocationLabel) badges.push(`Location: ${activeLocationLabel}`);
    if (typeof urlRadiusKm === "number" && Number.isFinite(urlRadiusKm)) {
      badges.push(`Within ${urlRadiusKm} km`);
    }
    if (sort !== "newest") badges.push(`Sort: ${PUBLIC_BROWSE_SORT_LABELS[sort]}`);

    return badges;
  }, [activeLocationLabel, query, resolvedCategoryLabel, sort, urlRadiusKm]);

  const activeFilterCount = activeFilterBadges.length;

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
        location: urlLocationId ? urlLocationLabel || undefined : undefined,
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
