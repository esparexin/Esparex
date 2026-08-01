import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

export const useSearch = () => {
  const [query, setQuery] = useState('');

  // Committed query — only updates when user submits, not on every keystroke.
  // This prevents firing a network request on every character typed.
  const [committedQuery, setCommittedQuery] = useState('');

  const result = useInfiniteQuery({
    queryKey: ['search', committedQuery],
    queryFn: async ({ pageParam = 1 }) => {
      return services.listingService.getMarketplaceFeed({
        search: committedQuery,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    // Don't run query when there is no search term
    enabled: committedQuery.trim().length > 0,
  });

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    setCommittedQuery(trimmed);
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setCommittedQuery('');
  }, []);

  return {
    query,
    committedQuery,
    handleQueryChange,
    handleSubmit,
    handleClear,
    ...result,
  };
};
