import { LIFECYCLE_STATUS, type LifecycleStatus } from '../../../shared/enums/lifecycle';

/**
 * Ad Transitions
 */
export const ALLOWED_AD_TRANSITIONS: Record<string, string[]> = {
    [LIFECYCLE_STATUS.PENDING]: [LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.REJECTED, LIFECYCLE_STATUS.DEACTIVATED, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.LIVE]: [LIFECYCLE_STATUS.PENDING, LIFECYCLE_STATUS.REJECTED, LIFECYCLE_STATUS.SOLD, LIFECYCLE_STATUS.EXPIRED, LIFECYCLE_STATUS.DEACTIVATED, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.SOLD]: [LIFECYCLE_STATUS.DEACTIVATED],
    [LIFECYCLE_STATUS.EXPIRED]: [LIFECYCLE_STATUS.PENDING, LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.DEACTIVATED, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.REJECTED]: [LIFECYCLE_STATUS.PENDING, LIFECYCLE_STATUS.DEACTIVATED, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.DEACTIVATED]: [LIFECYCLE_STATUS.PENDING, LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.DELETED],
};

/**
 * User Transitions
 */
export const ALLOWED_USER_TRANSITIONS: Record<string, string[]> = {
    [LIFECYCLE_STATUS.LIVE]: [LIFECYCLE_STATUS.SUSPENDED, LIFECYCLE_STATUS.BANNED, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.SUSPENDED]: [LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.BANNED, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.BANNED]: [LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.INACTIVE]: [LIFECYCLE_STATUS.LIVE],
    [LIFECYCLE_STATUS.DELETED]: [],
};

/**
 * Business Transitions
 */
export const ALLOWED_BUSINESS_TRANSITIONS: Record<string, string[]> = {
    [LIFECYCLE_STATUS.PENDING]: [LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.REJECTED],
    [LIFECYCLE_STATUS.LIVE]: [LIFECYCLE_STATUS.SUSPENDED, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.REJECTED]: [LIFECYCLE_STATUS.PENDING, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.SUSPENDED]: [LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.DELETED],
    [LIFECYCLE_STATUS.DELETED]: [],
};

/**
 * Service Transitions
 * NOTE: LIVE → PENDING is intentional — allows seller edits to force re-review.
 */
export const ALLOWED_SERVICE_TRANSITIONS: Record<string, string[]> = {
    [LIFECYCLE_STATUS.PENDING]: [LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.REJECTED],
    [LIFECYCLE_STATUS.LIVE]: [LIFECYCLE_STATUS.PENDING, LIFECYCLE_STATUS.EXPIRED, LIFECYCLE_STATUS.DEACTIVATED],
    [LIFECYCLE_STATUS.REJECTED]: [LIFECYCLE_STATUS.PENDING],
    [LIFECYCLE_STATUS.EXPIRED]: [LIFECYCLE_STATUS.LIVE],
    [LIFECYCLE_STATUS.DEACTIVATED]: [LIFECYCLE_STATUS.LIVE],
};

/**
 * Spare Part Listing Transitions
 * Separate from Service transitions — spare parts can be marked SOLD.
 */
export const ALLOWED_SPARE_PART_LISTING_TRANSITIONS: Record<string, string[]> = {
    [LIFECYCLE_STATUS.PENDING]: [LIFECYCLE_STATUS.LIVE, LIFECYCLE_STATUS.REJECTED],
    [LIFECYCLE_STATUS.LIVE]: [LIFECYCLE_STATUS.SOLD, LIFECYCLE_STATUS.EXPIRED, LIFECYCLE_STATUS.DEACTIVATED],
    [LIFECYCLE_STATUS.REJECTED]: [LIFECYCLE_STATUS.PENDING],
    [LIFECYCLE_STATUS.EXPIRED]: [LIFECYCLE_STATUS.LIVE],
    [LIFECYCLE_STATUS.DEACTIVATED]: [LIFECYCLE_STATUS.LIVE],
    [LIFECYCLE_STATUS.SOLD]: [],
};

export type ValidDomain = 'ad' | 'user' | 'business' | 'service' | 'catalog_part' | 'spare_part_listing';

/**
 * Resolves the logical lifecycle domain for an entity.
 * For the unified 'ad' collection, it maps to specific transition maps based on listingType.
 */
export function resolveLifecycleDomain(entityDomain: string, listingType?: string): ValidDomain {
    if (entityDomain === 'ad') {
        if (listingType === 'service') return 'service';
        if (listingType === 'spare_part') return 'spare_part_listing';
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
