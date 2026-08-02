import { useInfiniteQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import { ListingQueryParams } from '@esparex/contracts';

const DEFAULT_PAGE_SIZE = 20;

export const useMyListings = (params?: ListingQueryParams) => {
  return useInfiniteQuery({
    queryKey: ['listings', 'my', params],
    queryFn: async ({ pageParam = 1 }) => {
      return services.listingService.getMyListings({
        ...params,
        limit: DEFAULT_PAGE_SIZE,
        page: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length >= DEFAULT_PAGE_SIZE ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
