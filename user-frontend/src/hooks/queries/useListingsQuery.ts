import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { 
    getListingById, 
    getMyListings, 
    getMyListingsStats,
    getAdsPage,
    getHomeAds,
    type ListingPageResult,
    type ListingFilters,
    type HomeAdsPayload,
    type HomeAdsRequestParams
} from "@/lib/api/user/listings";
import { getSavedAds } from "@/lib/api/user/users";
import type { SavedAd } from "@/lib/api/user/users";

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
        staleTime: 10 * 60 * 1000, 
        initialData: options?.initialData,
    });
};

/**
 * Hook to fetch listings created by the current user (all types)
 */
export const useMyListingsQuery = (type?: string, status?: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.ads.myAds(status, type), // status first for compatibility, then type
        queryFn: () => getMyListings(type, status),
        staleTime: 0,
        ...options
    });
};

/**
 * Hook to fetch the current user's aggregated listing stats
 */
export const useMyListingsStatsQuery = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: queryKeys.ads.stats(),
        queryFn: () => getMyListingsStats(),
        staleTime: 5 * 60 * 1000,
        ...options
    });
};

/**
 * Hook to fetch paginated listings based on filters.
 */
export const useAdsListQuery = (
    filters: ListingFilters,
    options?: { enabled?: boolean; initialData?: ListingPageResult }
) => {
    return useQuery({
        queryKey: queryKeys.ads.list(filters),
        queryFn: () => getAdsPage(filters),
        staleTime: 5 * 60 * 1000,
        enabled: options?.enabled ?? true,
        initialData: options?.initialData,
    });
};

/**
 * Hook to fetch home feed listings.
 */
export const useHomeAdsQuery = (
    params?: HomeAdsRequestParams,
    options?: { enabled?: boolean; initialData?: HomeAdsPayload }
) => {
    const effectiveParams = params ?? {};
    return useQuery({
        queryKey: queryKeys.ads.home(effectiveParams),
        queryFn: () => getHomeAds(effectiveParams),
        staleTime: 1 * 60 * 1000, 
        enabled: options?.enabled ?? true,
        initialData: options?.initialData,
    });
};

/**
 * Hook to fetch listings saved (bookmarked) by current user
 */
export const useSavedAdsQuery = (options?: { enabled?: boolean }) => {
    return useQuery<SavedAd[]>({
        queryKey: queryKeys.ads.saved(),
        queryFn: () => getSavedAds(),
        staleTime: 5 * 60 * 1000,
        enabled: options?.enabled ?? true,
    });
};
