import { useState, useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ListingQueryParams } from '@esparex/contracts';
import { services } from '../../../../bootstrap';

const DEFAULT_PAGE_SIZE = 20;
const DEBOUNCE_DELAY_MS = 300;

export const useSearch = (initialFilters?: ListingQueryParams) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<ListingQueryParams>(initialFilters ?? {});

  // Automatically debounce query changes by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_DELAY_MS);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Combined search query parameters
  const activeParams: ListingQueryParams = useMemo(() => {
    return {
      ...filters,
      search: debouncedQuery.length > 0 ? debouncedQuery : undefined,
    };
  }, [filters, debouncedQuery]);

  // Calculate active filter count (excluding pagination and search text)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sortBy) count++;
    if (filters.condition || filters.deviceCondition) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.categoryId) count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  const hasSearchFilter = debouncedQuery.length > 0 || activeFilterCount > 0;

  const result = useInfiniteQuery({
    queryKey: ['listings', 'search', activeParams],
    queryFn: async ({ pageParam = 1 }) => {
      return services.listingService.getMarketplaceFeed({
        ...activeParams,
        limit: DEFAULT_PAGE_SIZE,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length >= DEFAULT_PAGE_SIZE ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: hasSearchFilter,
  });

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleSubmit = useCallback(() => {
    setDebouncedQuery(query.trim());
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleSelectCategory = useCallback((categoryId?: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
      page: 1,
    }));
  }, []);

  const handleRemoveSort = useCallback(() => {
    setFilters((prev) => ({ ...prev, sortBy: undefined, page: 1 }));
  }, []);

  const handleRemoveCondition = useCallback(() => {
    setFilters((prev) => ({ ...prev, condition: undefined, deviceCondition: undefined, page: 1 }));
  }, []);

  const handleRemovePrice = useCallback(() => {
    setFilters((prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined, page: 1 }));
  }, []);

  const handleRemoveVerifiedOnly = useCallback(() => {
    setFilters((prev) => ({ ...prev, verifiedOnly: undefined, page: 1 }));
  }, []);

  return {
    query,
    debouncedQuery,
    filters,
    activeFilterCount,
    hasSearchFilter,
    setFilters,
    handleQueryChange,
    handleSubmit,
    handleClear,
    handleClearFilters,
    handleSelectCategory,
    handleRemoveSort,
    handleRemoveCondition,
    handleRemovePrice,
    handleRemoveVerifiedOnly,
    ...result,
  };
};
