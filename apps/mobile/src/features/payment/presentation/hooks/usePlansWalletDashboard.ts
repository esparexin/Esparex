import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlansWalletV1DTO } from '@esparex/contracts';
import { services } from '../../../../bootstrap';
import { useAuth } from '../../../../providers/AuthProvider';

export const MOBILE_PLANS_WALLET_QUERY_KEYS = {
  all: ['mobile-plans-wallet'] as const,
  dashboard: (userId?: string) => [...MOBILE_PLANS_WALLET_QUERY_KEYS.all, 'dashboard', userId || 'me'] as const,
};

export function usePlansWalletDashboard(userId?: string) {
  const queryClient = useQueryClient();
  const { status } = useAuth();
  const isLoggedIn = status === 'authenticated';

  const query = useQuery<PlansWalletV1DTO | null>({
    queryKey: MOBILE_PLANS_WALLET_QUERY_KEYS.dashboard(userId),
    queryFn: () => services.paymentService.getPlansWalletDashboard(),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    return queryClient.invalidateQueries({
      queryKey: MOBILE_PLANS_WALLET_QUERY_KEYS.dashboard(userId),
    });
  };

  return {
    ...query,
    dashboardData: query.data,
    invalidateDashboard: invalidate,
  };
}
