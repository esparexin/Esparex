import { useQuery } from '@tanstack/react-query';
import { Plan } from '@esparex/contracts';
import { ApiPaymentRepository } from '../../application/ApiPaymentRepository';
import { PaymentService } from '../../application/PaymentService';

const paymentService = new PaymentService(new ApiPaymentRepository());

export function usePaymentPlans(enabled: boolean = true) {
  return useQuery<Plan[], Error>({
    queryKey: ['payment', 'plans'],
    queryFn: () => paymentService.getPlans(),
    enabled,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
