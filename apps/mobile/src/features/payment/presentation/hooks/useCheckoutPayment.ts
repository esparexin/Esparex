import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plan } from '@esparex/contracts';
import { ApiPaymentRepository } from '../../application/ApiPaymentRepository';
import { PaymentService } from '../../application/PaymentService';
import { PaymentOrder } from '../../domain/PaymentOrder';

const paymentService = new PaymentService(new ApiPaymentRepository());

export interface CheckoutInput {
  plan: Plan;
}

export function useCheckoutPayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentOrder, Error, CheckoutInput>({
    mutationFn: async ({ plan }: CheckoutInput) => {
      const order = await paymentService.createPaymentOrder(plan.id);
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['payment', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
