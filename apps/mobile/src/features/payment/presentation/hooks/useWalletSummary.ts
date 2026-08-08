import { useQuery } from '@tanstack/react-query';
import { WalletSummary } from '../../domain/WalletSummary';
import { services } from '../../../../bootstrap';

export function useWalletSummary(enabled: boolean = true) {
  return useQuery<WalletSummary, Error>({
    queryKey: ['payment', 'wallet'],
    queryFn: () => services.paymentService.getWalletSummary(),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true, // balance must reflect post-payment state on wallet screen entry
  });
}
