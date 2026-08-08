import { useQuery } from '@tanstack/react-query';
import { Listing } from '../../domain/Listing';
import { services } from '../../../../bootstrap';

export function useSavedListings(enabled: boolean = true) {
  return useQuery<readonly Listing[], Error>({
    queryKey: ['listings', 'saved'],
    queryFn: () => services.listingService.getSavedListings(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
