import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

interface NearbyBusinessesParams {
  locationId?: string;
  listingCategoryId?: string;
  limit?: number;
}

export const useNearbyBusinesses = (params?: NearbyBusinessesParams) => {
  const locationId = params?.locationId;
  const listingCategoryId = params?.listingCategoryId;

  return useQuery({
    queryKey: ['businesses', 'nearby', { locationId, listingCategoryId }],
    queryFn: async () => {
      return await services.businessService.getNearbyBusinesses(params);
    },
    enabled: Boolean(locationId || listingCategoryId),
    staleTime: 5 * 60 * 1000,
  });
};
