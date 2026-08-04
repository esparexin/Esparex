import { useState, useEffect } from 'react';
import type { UserBenefitsResponseDTO, ApiResponse } from '@esparex/contracts';
import { apiClient } from '@/lib/api/client';

export function useUserBenefits() {
    const [benefits, setBenefits] = useState<UserBenefitsResponseDTO | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchBenefits() {
            try {
                const response = await apiClient.get<ApiResponse<UserBenefitsResponseDTO>>('users/benefits/resolve', {
                    silent: true,
                });

                if (isMounted && response?.success) {
                    const rawData = response.data as unknown;
                    const cleanDTO = (rawData && typeof rawData === 'object' && 'data' in rawData)
                        ? (rawData as { data: UserBenefitsResponseDTO }).data
                        : (rawData as UserBenefitsResponseDTO);
                    if (cleanDTO && 'balances' in cleanDTO) {
                        setBenefits(cleanDTO);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void fetchBenefits();

        return () => {
            isMounted = false;
        };
    }, []);

    return { benefits, isLoading, error };
}

export default useUserBenefits;
