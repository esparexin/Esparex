"use client";

import { useCallback, useEffect, useState } from "react";
import { getCategories, type Category } from "@/lib/api/user/categories";
import { appendUniqueBrowseItems } from "@/lib/browse/appendUniqueBrowseItems";
import logger from "@/lib/logger";

export type BrowsePageResult<T> = {
  data: T[];
  pagination: {
    total?: number;
    hasMore?: boolean;
  };
};

export interface UseBrowseAdsDataOptions<TItem, TFilters> {
  initialResults?: BrowsePageResult<TItem>;
  initialCategories?: Category[];
  pageSize?: number;
  logScope: string;
  loadErrorMessage?: string;
  buildFilters: (page: number) => TFilters;
  fetchPage: (filters: TFilters) => Promise<BrowsePageResult<TItem>>;
}

export function useBrowseAdsData<TItem, TFilters>({
  initialResults,
  initialCategories,
  logScope,
  loadErrorMessage = "Failed to load results. Please try again.",
  buildFilters,
  fetchPage,
}: UseBrowseAdsDataOptions<TItem, TFilters>) {
  const [items, setItems] = useState<TItem[]>(initialResults?.data ?? []);
  const [total, setTotal] = useState(initialResults?.pagination.total ?? 0);
  const [hasMore, setHasMore] = useState(initialResults?.pagination.hasMore ?? false);
  const [loading, setLoading] = useState(!initialResults);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      return;
    }

    getCategories()
      .then(setCategories)
      .catch((err) => {
        logger.warn(`[${logScope}] Failed to fetch categories:`, err);
      });
  }, [initialCategories, logScope]);

  const loadPageData = useCallback(
    async (requestedPage: number) => {
      setLoading(true);
      setError(null);

      try {
        const filters = buildFilters(requestedPage);
        const result = await fetchPage(filters);

        setItems((prev) => (requestedPage === 1 ? result.data : appendUniqueBrowseItems(prev, result.data)));
        setTotal(result.pagination.total ?? result.data.length);
        setHasMore(result.pagination.hasMore ?? false);
      } catch (fetchError) {
        logger.error(`[${logScope}] Data loading error:`, fetchError);
        setError(loadErrorMessage);
      } finally {
        setLoading(false);
      }
    },
    [buildFilters, fetchPage, loadErrorMessage, logScope]
  );

  return {
    items,
    total,
    hasMore,
    loading,
    setLoading,
    error,
    setError,
    categories,
    loadPageData,
    setItems,
  };
}
