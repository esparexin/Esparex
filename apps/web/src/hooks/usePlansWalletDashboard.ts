import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlansWalletV1DTO } from '@esparex/contracts';
import { apiClient } from '@/lib/api/client';

export const PLANS_WALLET_QUERY_KEYS = {
  all: ['plans-wallet'] as const,
  dashboard: (userId?: string) => [...PLANS_WALLET_QUERY_KEYS.all, 'dashboard', userId || 'me'] as const,
};

async function fetchPlansWalletDashboard(): Promise<PlansWalletV1DTO | null> {
  try {
    const res = await apiClient.get<{ success?: boolean; data?: PlansWalletV1DTO }>('/payments/account/plans-wallet');
    if (res?.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch plans wallet dashboard:', error);
    return null;
  }
}

export function usePlansWalletDashboard(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<PlansWalletV1DTO | null>({
    queryKey: PLANS_WALLET_QUERY_KEYS.dashboard(userId),
    queryFn: fetchPlansWalletDashboard,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    return queryClient.invalidateQueries({
      queryKey: PLANS_WALLET_QUERY_KEYS.dashboard(userId),
    });
  };

  return {
    ...query,
    dashboardData: query.data,
    invalidateDashboard: invalidate,
  };
}
