import { apiClient } from "@/lib/api/client";
import { toPaginatedApiResult, toApiResult } from '@/lib/api/result';
import logger from "@/lib/logger";
import { normalizeListing, type ListingPageResult, type Listing } from './normalizer';

/**
 * Fetch the current user's listings across all types.
 */
export const getMyListings = async (type?: string, status?: string, page = 1, limit = 20): Promise<ListingPageResult> => {
    const params = new URLSearchParams();
    if (type) params.append('listingType', type);
    
    let tab = 'live';
    if (status === 'pending') tab = 'pending';
    if (status === 'expired') tab = 'expired';
    params.append('tab', tab);

    params.append('page', String(page));
    params.append('limit', String(limit));

    const endpoint = `listings/my?${params.toString()}`;
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
};


export type ListingStatsResponse = Record<string, Record<string, number>>;
/**
 * Fetch aggregated listing status counts for all types in one pass.
 */
export const getMyListingsStats = async (): Promise<ListingStatsResponse> => {
    try {
        const { data: result } = await toApiResult<any>(
            apiClient.get('listings/my/status-counts')
        );
        return {
            ad: {
                live: result?.live || 0,
                pending: result?.pending || 0,
                expired: result?.expired || 0,
            },
            service: {
                live: 0,
                pending: 0,
                expired: 0,
            },
            "spare_part": {
                live: 0,
                pending: 0,
                expired: 0,
            },
        };
    } catch (e) {
        logger.error('Failed to load listing stats', e);
        return {};
    }
};