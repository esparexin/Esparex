import { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

const DEFAULT_PAGE_SIZE = 20;
const DEBOUNCE_DELAY_MS = 300;

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Automatically debounce query changes by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_DELAY_MS);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const result = useInfiniteQuery({
    queryKey: ['listings', 'search', debouncedQuery],
    queryFn: async ({ pageParam = 1 }) => {
      return services.listingService.getMarketplaceFeed({
        search: debouncedQuery,
        limit: DEFAULT_PAGE_SIZE,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length >= DEFAULT_PAGE_SIZE ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: debouncedQuery.length > 0,
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

  return {
    query,
    debouncedQuery,
    handleQueryChange,
    handleSubmit,
    handleClear,
    ...result,
  };
};
