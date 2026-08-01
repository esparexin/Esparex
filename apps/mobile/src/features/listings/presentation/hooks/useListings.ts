import { useInfiniteQuery } from '@tanstack/react-query';
import { ListingQueryParams } from '@esparex/contracts';
import { services } from '../../../../bootstrap';

const DEFAULT_PAGE_SIZE = 20;

/**
 * useListings — custom React Query hook for marketplace listing feed infinite pagination.
 *
 * Encapsulates infinite query fetching, query key caching, and clean pagination boundary detection.
 */
export const useListings = (queryParams?: ListingQueryParams) => {
  return useInfiniteQuery({
    queryKey: ['listings', queryParams],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        limit: DEFAULT_PAGE_SIZE,
        ...queryParams,
        page: pageParam,
      };
      return services.listingService.getMarketplaceFeed(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      const pageSize = queryParams?.limit || DEFAULT_PAGE_SIZE;
      return lastPage.length >= pageSize ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
