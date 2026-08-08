import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlansWalletV1DTO } from '@esparex/contracts';
import { apiClient } from '../../../../infrastructure/api/apiClient';

export const MOBILE_PLANS_WALLET_QUERY_KEYS = {
  all: ['mobile-plans-wallet'] as const,
  dashboard: (userId?: string) => [...MOBILE_PLANS_WALLET_QUERY_KEYS.all, 'dashboard', userId || 'me'] as const,
};

async function fetchPlansWalletDashboard(): Promise<PlansWalletV1DTO | null> {
  try {
    const res = await apiClient.get<{ success?: boolean; data?: PlansWalletV1DTO }>('/v1/payments/account/plans-wallet');
    if (res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch mobile plans wallet dashboard:', error);
    return null;
  }
}

export function usePlansWalletDashboard(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<PlansWalletV1DTO | null>({
    queryKey: MOBILE_PLANS_WALLET_QUERY_KEYS.dashboard(userId),
    queryFn: fetchPlansWalletDashboard,
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
