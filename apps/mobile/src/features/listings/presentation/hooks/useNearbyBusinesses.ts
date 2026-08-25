import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

interface NearbyBusinessesParams {
  category?: string;
  city?: string;
  limit?: number;
}

export const useNearbyBusinesses = (params?: NearbyBusinessesParams) => {
  const category = params?.category;
  const city = params?.city;

  return useQuery({
    queryKey: ['businesses', 'nearby', { category, city }],
    queryFn: async () => {
      return await services.businessService.getNearbyBusinesses(params);
    },
    enabled: Boolean(category || city),
    staleTime: 5 * 60 * 1000,
  });
};
