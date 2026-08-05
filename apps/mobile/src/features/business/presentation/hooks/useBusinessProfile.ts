import { useQuery } from '@tanstack/react-query';
import { Business } from '@esparex/contracts';
import { ApiBusinessRepository } from '../../application/ApiBusinessRepository';
import { BusinessService } from '../../application/BusinessService';

const businessService = new BusinessService(new ApiBusinessRepository());

export function useBusinessProfile(enabled: boolean = true) {
  return useQuery<Business | null, Error>({
    queryKey: ['business', 'me'],
    queryFn: () => businessService.getMyBusiness(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
