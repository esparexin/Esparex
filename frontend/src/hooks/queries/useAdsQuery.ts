import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import {
    getAdsPage,
    getHomeAds,
    getMyAds,
    getMyAdsStats,
    type AdPageResult,
    type AdFilters,
    type HomeAdsPayload,
    type HomeAdsRequestParams,
} from "@/lib/api/user/ads";
import { getSavedAds } from "@/lib/api/user/users";

/**
 * Hook to fetch paginated ads based on filters.
 * Pass `{ enabled: isLoaded }` to gate the fetch until location is resolved.
 */
export const useAdsListQuery = (
    filters: AdFilters,
    options?: { enabled?: boolean; initialData?: AdPageResult }
) => {
    return useQuery({
        queryKey: queryKeys.ads.list(filters),
        queryFn: () => getAdsPage(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: options?.enabled ?? true,
        initialData: options?.initialData,
    });
};


/**
 * Hook to fetch home ads based on location parameters.
 * Pass `{ enabled: isLoaded }` to gate the fetch until location is resolved.
 */
export const useHomeAdsQuery = (
    params?: HomeAdsRequestParams,
    options?: { enabled?: boolean; initialData?: HomeAdsPayload }
) => {
    const effectiveParams = params ?? {};
    return useQuery({
        queryKey: queryKeys.ads.home(effectiveParams),
        queryFn: () => getHomeAds(effectiveParams),
        staleTime: 1 * 60 * 1000, // Keep in sync with backend home-feed Redis TTL.
        enabled: options?.enabled ?? true,
        initialData: options?.initialData,
    });
};

/**
 * Hook to fetch ads created by the current user
 */
export const useMyAdsQuery = (status?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.ads.myAds(status),
        queryFn: () => getMyAds(status),
        staleTime: 0, // Generally want this to always refetch to be fresh on load
        ...options
    });
};

/**
 * Hook to fetch the current user's ads stats
 */
export const useMyAdsStatsQuery = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.ads.stats(),
        queryFn: () => getMyAdsStats(),
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

/**
 * Hook to fetch ads saved (bookmarked) by current user
 */
export const useSavedAdsQuery = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.ads.saved(),
        queryFn: () => getSavedAds(),
        staleTime: 5 * 60 * 1000,
        enabled: options?.enabled ?? true,
    });
};
