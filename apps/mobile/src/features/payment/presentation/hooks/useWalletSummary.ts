import { useQuery } from '@tanstack/react-query';
import { WalletSummary } from '../../domain/WalletSummary';
import { ApiPaymentRepository } from '../../application/ApiPaymentRepository';
import { PaymentService } from '../../application/PaymentService';

const paymentService = new PaymentService(new ApiPaymentRepository());

export function useWalletSummary(enabled: boolean = true) {
  return useQuery<WalletSummary, Error>({
    queryKey: ['payment', 'wallet'],
    queryFn: () => paymentService.getWalletSummary(),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
