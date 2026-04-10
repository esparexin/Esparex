import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from '../../routes';
import { toApiResult, unwrapApiPayload } from '@/lib/api/result';
import logger from "@/lib/logger";
import { fetchUserApiJson } from '../server';
import { normalizeListingIdentifier, isValidListingIdentifier, normalizeListing, type Listing, type ListingAnalytics, type ListingPhoneResponse } from './normalizer';

export interface GetListingByIdOptions {
    throwOnServerError?: boolean;
}

// --- Generic API Functions ---

export const getListingById = async (
    id: string | number,
    headers?: Record<string, string>,
    options?: GetListingByIdOptions
): Promise<Listing | null> => {
    const normalizedIdentifier = normalizeListingIdentifier(id);
    if (!isValidListingIdentifier(normalizedIdentifier)) return null;
    try {
        const endpoint = API_ROUTES.USER.LISTING_DETAIL(normalizedIdentifier);
        if (typeof window === 'undefined') {
            const json = await fetchUserApiJson(endpoint, { cache: 'no-store', headers: { Accept: 'application/json', ...(headers || {}) } });
            const payload = unwrapApiPayload(json);
            return payload ? normalizeListing(payload) : null;
        }
        const { data: result, statusCode } = await toApiResult<Listing>(apiClient.get(endpoint, { headers, silent: true }));
        if (statusCode === 404 || !result) return null;
        return normalizeListing(result);
    } catch (e) {
        if (typeof window === 'undefined' && options?.throwOnServerError) {
            const status = typeof (e as { status?: unknown })?.status === 'number'
                ? Number((e as { status?: number }).status)
                : Number.parseInt(String((e as Error).message || '').split(':').pop() || '', 10);
            if (status === 404 || status === 403) {
                return null;
            }
            throw e;
        }
        logger.error('Failed to load listing', e);
        return null;
    }
};

export const getListingAnalytics = async (id: string | number): Promise<ListingAnalytics | null> => {
    try {
        const { data } = await toApiResult<ListingAnalytics>(apiClient.get(API_ROUTES.USER.LISTING_ANALYTICS(id)));
        return data;
    } catch (e) {
        logger.error('Failed to load listing analytics', e);
        return null;
    }
};

export const incrementListingView = async (id: string | number): Promise<void> => {
    try {
        await apiClient.get(API_ROUTES.USER.LISTING_VIEW(id), { silent: true });
    } catch (e) {
        logger.error('Failed to increment listing view', e);
    }
};
/**
 * Reveals the seller's phone number for a listing.
 */
export const getListingPhone = async (id: string | number): Promise<ListingPhoneResponse | null> => {
    try {
        const { data, error } = await toApiResult<ListingPhoneResponse>(
            apiClient.get(API_ROUTES.USER.LISTING_PHONE(id), { silent: true })
        );
        if (error) throw error;
        return data;
    } catch (e) {
        logger.error('Failed to get listing phone', e);
        throw e;
    }
};