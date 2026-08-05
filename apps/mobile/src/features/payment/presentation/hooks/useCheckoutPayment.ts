import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plan } from '@esparex/contracts';
import { ApiPaymentRepository } from '../../application/ApiPaymentRepository';
import { PaymentService } from '../../application/PaymentService';
import { PaymentSuccessResult } from '../../application/IPaymentRepository';

const paymentService = new PaymentService(new ApiPaymentRepository());

export interface CheckoutInput {
  plan: Plan;
}

export function useCheckoutPayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentSuccessResult, Error, CheckoutInput>({
    mutationFn: async ({ plan }: CheckoutInput) => {
      return await paymentService.processCheckout(plan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['payment', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
