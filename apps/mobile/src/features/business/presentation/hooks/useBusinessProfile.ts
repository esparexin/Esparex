import { useQuery } from '@tanstack/react-query';
import { Business } from '@esparex/contracts';
import { services } from '../../../../bootstrap';

export function useBusinessProfile(enabled: boolean = true) {
  return useQuery<Business | null, Error>({
    queryKey: ['business', 'me'],
    queryFn: () => services.businessService.getMyBusiness(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
