import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plan } from '@esparex/contracts';
import { services } from '../../../../bootstrap';
import { PaymentSuccessResult } from '../../application/IPaymentRepository';

export interface CheckoutInput {
  plan: Plan;
}

export function useCheckoutPayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentSuccessResult, Error, CheckoutInput>({
    mutationFn: async ({ plan }: CheckoutInput) => {
      return await services.paymentService.processCheckout(plan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['payment', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
