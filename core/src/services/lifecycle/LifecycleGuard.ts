import { LIFECYCLE_STATUS, LISTING_TYPE } from '@esparex/contracts';
import {
    ALLOWED_AD_TRANSITIONS,
    ALLOWED_USER_TRANSITIONS,
    ALLOWED_BUSINESS_TRANSITIONS,
    ALLOWED_SERVICE_TRANSITIONS,
    ALLOWED_SPARE_PART_LISTING_TRANSITIONS
} from '@esparex/shared';

export {
    ALLOWED_AD_TRANSITIONS,
    ALLOWED_USER_TRANSITIONS,
    ALLOWED_BUSINESS_TRANSITIONS,
    ALLOWED_SERVICE_TRANSITIONS,
    ALLOWED_SPARE_PART_LISTING_TRANSITIONS
};

export type ValidDomain = 'ad' | 'user' | 'business' | 'service' | 'catalog_part' | 'spare_part_listing';

/**
 * Resolves the logical lifecycle domain for an entity.
 * For the unified 'ad' collection, it maps to specific transition maps based on listingType.
 */
export function resolveLifecycleDomain(entityDomain: string, listingType?: string): ValidDomain {
    if (entityDomain === 'ad') {
        if (listingType === LISTING_TYPE.SERVICE) return 'service';
        if (listingType === LISTING_TYPE.SPARE_PART) return 'spare_part_listing';
        return 'ad';
    }
    return entityDomain as ValidDomain;
}

export const MAPS: Record<ValidDomain, Record<string, string[]>> = {
    ad: ALLOWED_AD_TRANSITIONS,
    user: ALLOWED_USER_TRANSITIONS,
    business: ALLOWED_BUSINESS_TRANSITIONS,
    service: ALLOWED_SERVICE_TRANSITIONS,
    // 'catalog_part' = admin-managed SparePart catalog entity (not the marketplace SparePartListing).
    // Reuses service transitions: no SOLD state for catalog entries.
    catalog_part: ALLOWED_SERVICE_TRANSITIONS,
    spare_part_listing: ALLOWED_SPARE_PART_LISTING_TRANSITIONS
};

/**
 * Normalizes input status to handle legacy 'active' vs 'live' during migration.
 */
const normalizeInputStatus = (status: string): string => {
    if (status === 'active' || status === 'approved') return LIFECYCLE_STATUS.LIVE;
    return status;
};

export const isValidLifecycleTransition = (
    domain: ValidDomain,
    currentStatus: string,
    nextStatus: string
): boolean => {
    const from = normalizeInputStatus(currentStatus);
    const to = normalizeInputStatus(nextStatus);
    return MAPS[domain][from]?.includes(to) ?? false;
};

export const validateTransition = (
    domain: ValidDomain,
    currentStatus: string,
    nextStatus: string
) => {
    if (!isValidLifecycleTransition(domain, currentStatus, nextStatus)) {
        const error = new Error(`Invalid lifecycle transition in ${domain} domain: ${currentStatus} → ${nextStatus}`) as Error & {
            statusCode?: number;
            code?: string;
        };
        error.statusCode = 400;
        error.code = 'INVALID_LIFECYCLE_TRANSITION';
        throw error;
    }
};
