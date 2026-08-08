import { useQuery } from '@tanstack/react-query';
import { Plan } from '@esparex/contracts';
import { services } from '../../../../bootstrap';

export function usePaymentPlans(enabled: boolean = true) {
  return useQuery<Plan[], Error>({
    queryKey: ['payment', 'plans'],
    queryFn: () => services.paymentService.getPlans(),
    enabled,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
