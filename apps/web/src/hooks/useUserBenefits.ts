import { useQuery } from '@tanstack/react-query';
import type { UserBenefitsResponseDTO, ApiResponse } from '@esparex/contracts';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/hooks/queries/queryKeys';
import { useCurrentUser } from '@/hooks/useCurrentUser';

async function fetchUserBenefitsApi(): Promise<UserBenefitsResponseDTO | null> {
    const response = await apiClient.get<ApiResponse<UserBenefitsResponseDTO>>('users/benefits/resolve', {
        silent: true,
    });

    if (!response?.success) return null;

    const rawData = response.data as unknown;
    const cleanDTO = (rawData && typeof rawData === 'object' && 'data' in rawData)
        ? (rawData as { data: UserBenefitsResponseDTO }).data
        : (rawData as UserBenefitsResponseDTO);

    return (cleanDTO && 'balances' in cleanDTO) ? cleanDTO : null;
}

export function useUserBenefits() {
    const { status } = useCurrentUser();

    const { data: benefits, isLoading, error } = useQuery({
        queryKey: queryKeys.user.benefits(),
        queryFn: fetchUserBenefitsApi,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        enabled: status === 'authenticated',
    });

    return {
        benefits: benefits ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Unknown error') : null,
    };
}

export default useUserBenefits;
