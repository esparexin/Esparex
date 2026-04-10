import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from '../../routes';
import { toApiResult } from '@/lib/api/result';
import logger from "@/lib/logger";
import { LISTING_TYPE, type ListingTypeValue } from '@shared/enums/listingType';
import { normalizeListing, stripEmptyObjectIdFields, type Listing } from './normalizer';

function getDeleteListingEndpoint(id: string | number, listingType: ListingTypeValue): string {
    switch (listingType) {
        case LISTING_TYPE.SERVICE:
            return `${API_ROUTES.USER.SERVICES}/${encodeURIComponent(String(id))}`;
        case LISTING_TYPE.SPARE_PART:
            return API_ROUTES.USER.SPARE_PART_LISTING_DETAIL(String(id));
        case LISTING_TYPE.AD:
        default:
            return API_ROUTES.USER.AD_DETAIL(id);
    }
}

function getRepostListingEndpoint(id: string | number, listingType: ListingTypeValue): string {
    switch (listingType) {
        case LISTING_TYPE.SERVICE:
            return API_ROUTES.USER.SERVICE_REPOST(String(id));
        case LISTING_TYPE.SPARE_PART:
            return API_ROUTES.USER.SPARE_PART_REPOST(String(id));
        case LISTING_TYPE.AD:
        default:
            return API_ROUTES.USER.AD_REPOST(id);
    }
}
/**
 * Helper to execute mutation requests with unified error handling.
 */
const executeListingMutationRequest = async (
    requestPromise: Promise<any>,
    errorMessage: string
): Promise<Listing | null> => {
    try {
        const { data, error } = await toApiResult<Listing>(requestPromise);
        if (error) throw error;
        if (!data) throw new Error(errorMessage);
        return data ? normalizeListing(data) : null;
    } catch (e) {
        logger.error(errorMessage, e);
        throw e;
    }
};

/**
 * Creates a new listing (Ad, Service, or Spare Part).
 */
export const createListing = async (
    listingData: Partial<Listing>,
    options?: { endpoint?: string; idempotencyKey?: string; errorMessage?: string }
): Promise<Listing | null> => {
    const sanitizedPayload = stripEmptyObjectIdFields(listingData as Record<string, unknown>);
    const endpoint = options?.endpoint || API_ROUTES.USER.ADS;
    const headers = options?.idempotencyKey && options.idempotencyKey.trim().length > 0
        ? { 'Idempotency-Key': options.idempotencyKey.trim() }
        : undefined;

    return executeListingMutationRequest(
        apiClient.post<unknown>(endpoint, sanitizedPayload, {
            silent: true,
            ...(headers ? { headers } : {}),
        }),
        options?.errorMessage || "Failed to create listing"
    );
};

/**
 * Updates an existing listing.
 */
export const updateListing = async (
    id: string | number,
    listingData: Partial<Listing>,
    options?: { endpoint?: string }
): Promise<Listing | null> => {
    const sanitizedPayload = stripEmptyObjectIdFields(listingData as Record<string, unknown>);
    const endpoint = options?.endpoint || API_ROUTES.USER.LISTING_EDIT(id);

    return executeListingMutationRequest(
        apiClient.put<unknown>(endpoint, sanitizedPayload, {
            silent: true,
        }),
        "Failed to update listing"
    );
};

/**
 * Deletes a listing (soft delete).
 */
export const deleteListing = async (
    id: string | number,
    listingType: ListingTypeValue = LISTING_TYPE.AD
): Promise<boolean> => {
    try {
        const api = await toApiResult<{ success?: boolean }>(
            apiClient.delete(getDeleteListingEndpoint(id, listingType), { silent: true })
        );
        if (api.error) throw api.error;
        return api.data?.success !== false;
    } catch (e) {
        logger.error('Failed to delete listing', e);
        throw e;
    }
};

/**
 * Marks a listing as sold.
 */
export const markListingAsSold = async (
    id: string | number,
    soldReason?: 'sold_on_platform' | 'sold_outside' | 'no_longer_available'
): Promise<Listing | null> => {
    try {
        const { data: result, error } = await toApiResult<Listing>(
            apiClient.put(API_ROUTES.USER.LISTING_SOLD(id), soldReason ? { soldReason } : {}, { silent: true })
        );
        if (error) throw error;
        return result ? normalizeListing(result) : null;
    } catch (e) {
        logger.error('Failed to mark listing as sold', e);
        throw e;
    }
};
export const markAsSold = markListingAsSold;
/**
 * Deactivates a live listing.
 */
export const deactivateListing = async (id: string | number): Promise<boolean> => {
    try {
        const { data: result, error } = await toApiResult<unknown>(
            apiClient.patch(API_ROUTES.USER.LISTING_DEACTIVATE(id), undefined, { silent: true })
        );
        if (error) throw error;
        return !!result;
    } catch (e) {
        logger.error('Failed to deactivate listing', e);
        throw e;
    }
};
/**
 * Reposts an expired listing.
 */
export const repostListing = async (
    id: string | number,
    listingType: ListingTypeValue = LISTING_TYPE.AD
): Promise<boolean> => {
    try {
        const { data: result, error } = await toApiResult<unknown>(
            apiClient.post(getRepostListingEndpoint(id, listingType), undefined, { silent: true })
        );
        if (error) throw error;
        return !!result;
    } catch (e) {
        logger.error('Failed to repost listing', e);
        throw e;
    }
};