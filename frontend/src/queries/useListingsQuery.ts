import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { getListingById } from '@/api/user/ads';

/**
 * Enterprise Unified Listing Detail Query
 * Supports Ads, Services, and Spare Parts via /api/v1/listings/:id
 */
export const useListingDetailQuery = (
    id: string | number,
    options?: { enabled?: boolean; initialData?: Awaited<ReturnType<typeof getListingById>> }
) => {
    return useQuery({
        queryKey: queryKeys.ads.detail(id), // Reusing ads.detail key for cache consistency
        queryFn: () => getListingById(id),
        enabled: !!id && (options?.enabled ?? true),
        staleTime: 10 * 60 * 1000, // 10 minutes
        initialData: options?.initialData,
    });
};
