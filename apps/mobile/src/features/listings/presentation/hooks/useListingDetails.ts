import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

export const useListingDetails = (listingId: string) => {
  return useQuery({
    queryKey: ['listings', 'detail', listingId],
    queryFn: async () => {
      return await services.listingService.getListingDetails(listingId);
    },
    enabled: !!listingId,
  });
};
