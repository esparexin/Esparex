import { useQuery } from '@tanstack/react-query';
import { Listing } from '../../domain/Listing';
import { ApiListingRepository } from '../../application/ApiListingRepository';

const listingRepo = new ApiListingRepository();

export function useSavedListings(enabled: boolean = true) {
  return useQuery<readonly Listing[], Error>({
    queryKey: ['listings', 'saved'],
    queryFn: () => listingRepo.getSavedListings(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
