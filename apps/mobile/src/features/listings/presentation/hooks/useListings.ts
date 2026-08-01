import { useInfiniteQuery } from '@tanstack/react-query';
import { ListingQueryParams } from '@esparex/contracts';
import { useAuth } from '../../../../providers/AuthProvider';
import { Listing } from '../../domain/Listing';

// Ensure services is available or import from bootstrap
// For now, we rely on the global services export or a provider. 
// Since we used AppProvider with DI, we might need a useServices hook, but for simplicity we can import bootstrap if allowed, 
// or pass it in context. AuthProvider exposes authService, but not listingService.
// Let's import the bootstrap services directly as it's the composition root.
import { services } from '../../../../bootstrap';

export const useListings = (queryParams?: ListingQueryParams) => {
  return useInfiniteQuery({
    queryKey: ['listings', queryParams],
    queryFn: async ({ pageParam = 1 }) => {
      // In a real app, pageParam would be passed to the service
      const params = { ...queryParams, page: pageParam };
      return services.listingService.getMarketplaceFeed(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      // If we got data, maybe there's a next page.
      // Real implementation depends on API paginated response format inside the service.
      // For now, if we get items, assume there might be more. 
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
