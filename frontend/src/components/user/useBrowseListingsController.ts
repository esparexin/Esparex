"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getCategories, type Category } from "@/lib/api/user/categories";
import { useLocationState, type LocationData } from "@/context/LocationContext";
import {
  getDisplayLocationLabel,
  getSearchLocationLabel,
  sanitizeLocationLabel,
} from "@/lib/location/locationLabels";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import logger from "@/lib/logger";
import type { SortOption } from "@/components/search/SearchResultsHeader";
import {
  buildPublicBrowseRoute,
  parsePublicBrowseParams,
  type PublicBrowseType,
} from "@/lib/publicBrowseRoutes";
import { PUBLIC_BROWSE_SORT_LABELS } from "@/lib/publicBrowseSort";
import { usePersistedBrowseView } from "@/components/user/browseViewPreference";
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
  const locationSearchLabel = useMemo(
    () => getSearchLocationLabel(location),
    [
      location.city,
      location.country,
      location.display,
      location.level,
      location.name,
      location.source,
      location.state,
    ]
  );
  const stableLocation = useMemo(
    () => location,
    [
      locationSearchLabel,
      location.country,
      location.display,
      location.level,
      location.locationId,
      location.name,
      location.source,
      location.state,
      locationLatitude,
      locationLongitude,
    ]
  );

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
    return (
      Boolean(urlLocationId || urlLocationLabel || stableLocation.locationId) ||
      (locationLatitude != null && locationLongitude != null)
    );
  }, [locationLatitude, locationLongitude, stableLocation.locationId, urlLocationId, urlLocationLabel]);

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
    if (!selectedCategory) return null;

    const normalizedCategory = selectedCategory.trim();
    const matchedCategory = categories.find(
      (category) => category.id === normalizedCategory || category.slug === normalizedCategory
    );

    if (matchedCategory?.name) return matchedCategory.name;
    if (matchedCategory?.slug) return matchedCategory.slug;
    return normalizedCategory || null;
  }, [categories, selectedCategory]);

  const activeLocationLabel = useMemo(() => {
    if (urlLocationLabel) return urlLocationLabel;
    if (stableLocation.source === "default") return null;
    return getDisplayLocationLabel(stableLocation) || null;
  }, [stableLocation, urlLocationLabel]);

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
