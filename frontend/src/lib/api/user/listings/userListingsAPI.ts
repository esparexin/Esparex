import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from '../../routes';
import { toPaginatedApiResult, toApiResult } from '@/lib/api/result';
import logger from "@/lib/logger";
import { normalizeListing, type ListingPageResult, type Listing } from './normalizer';

/**
 * Fetch the current user's listings across all types.
 */
export const getMyListings = async (type?: string, status?: string, page = 1, limit = 20): Promise<ListingPageResult> => {
    try {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        params.append('page', String(page));
        params.append('limit', String(limit));

        const endpoint = `${API_ROUTES.USER.MY_LISTINGS}?${params.toString()}`;
        const { data: result, error } = await toPaginatedApiResult<Listing>(
            apiClient.get(endpoint)
        );

        if (error) {
            throw error;
        }

        if (!result) {
            return { data: [], pagination: { total: 0, page, limit, hasMore: false } };
        }

        return {
            data: result.data.map(normalizeListing),
            pagination: result.pagination,
        };
    } catch (e) {
        throw e;
    }
};

/**
 * @deprecated Use getMyListings('ad', status).then(res => res.data)
 */
export const getMyAds = async (status?: string): Promise<Listing[]> => {
    try {
        const result = await getMyListings('ad', status);
        return result.data;
    } catch (e) {
        const statusCode = (e as any)?.context?.statusCode || (e as any)?.statusCode || 500;
        throw new Error(`MyAds API error: ${statusCode}`);
    }
};
export type ListingStatsResponse = Record<string, Record<string, number>>;
/**
 * Fetch aggregated listing status counts for all types in one pass.
 */
export const getMyListingsStats = async (): Promise<ListingStatsResponse> => {
    try {
        const { data: result } = await toApiResult<ListingStatsResponse>(
            apiClient.get(API_ROUTES.USER.MY_LISTINGS_STATS)
        );
        return result || {};
    } catch (e) {
        logger.error('Failed to load listing stats', e);
        return {};
    }
};