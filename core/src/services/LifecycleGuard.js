"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTransition = exports.isValidLifecycleTransition = exports.MAPS = exports.ALLOWED_SPARE_PART_LISTING_TRANSITIONS = exports.ALLOWED_SERVICE_TRANSITIONS = exports.ALLOWED_BUSINESS_TRANSITIONS = exports.ALLOWED_USER_TRANSITIONS = exports.ALLOWED_AD_TRANSITIONS = void 0;
exports.resolveLifecycleDomain = resolveLifecycleDomain;
const lifecycle_1 = require("@core/constants/enums/lifecycle");
const listingType_1 = require("@core/constants/enums/listingType");
/**
 * Ad Transitions
 */
exports.ALLOWED_AD_TRANSITIONS = {
    [lifecycle_1.LIFECYCLE_STATUS.PENDING]: [lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.REJECTED, lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.LIVE]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.REJECTED, lifecycle_1.LIFECYCLE_STATUS.SOLD, lifecycle_1.LIFECYCLE_STATUS.EXPIRED, lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.SOLD]: [lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED],
    [lifecycle_1.LIFECYCLE_STATUS.EXPIRED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.REJECTED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.DELETED],
};
/**
 * User Transitions
 */
exports.ALLOWED_USER_TRANSITIONS = {
    [lifecycle_1.LIFECYCLE_STATUS.LIVE]: [lifecycle_1.LIFECYCLE_STATUS.SUSPENDED, lifecycle_1.LIFECYCLE_STATUS.BANNED, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.SUSPENDED]: [lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.BANNED, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.BANNED]: [lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.INACTIVE]: [lifecycle_1.LIFECYCLE_STATUS.LIVE],
    [lifecycle_1.LIFECYCLE_STATUS.DELETED]: [],
};
/**
 * Business Transitions
 */
exports.ALLOWED_BUSINESS_TRANSITIONS = {
    [lifecycle_1.LIFECYCLE_STATUS.PENDING]: [lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.REJECTED],
    [lifecycle_1.LIFECYCLE_STATUS.LIVE]: [lifecycle_1.LIFECYCLE_STATUS.SUSPENDED, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.REJECTED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.SUSPENDED]: [lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.DELETED],
    [lifecycle_1.LIFECYCLE_STATUS.DELETED]: [],
};
/**
 * Service Transitions
 * NOTE: LIVE → PENDING is intentional — allows seller edits to force re-review.
 */
exports.ALLOWED_SERVICE_TRANSITIONS = {
    [lifecycle_1.LIFECYCLE_STATUS.PENDING]: [lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.REJECTED],
    [lifecycle_1.LIFECYCLE_STATUS.LIVE]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.SOLD, lifecycle_1.LIFECYCLE_STATUS.EXPIRED, lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED],
    [lifecycle_1.LIFECYCLE_STATUS.SOLD]: [lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED],
    [lifecycle_1.LIFECYCLE_STATUS.REJECTED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING],
    [lifecycle_1.LIFECYCLE_STATUS.EXPIRED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.LIVE],
    [lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED]: [lifecycle_1.LIFECYCLE_STATUS.LIVE],
};
/**
 * Spare Part Listing Transitions
 * Separate from Service transitions — spare parts can be marked SOLD.
 */
exports.ALLOWED_SPARE_PART_LISTING_TRANSITIONS = {
    [lifecycle_1.LIFECYCLE_STATUS.PENDING]: [lifecycle_1.LIFECYCLE_STATUS.LIVE, lifecycle_1.LIFECYCLE_STATUS.REJECTED],
    [lifecycle_1.LIFECYCLE_STATUS.LIVE]: [lifecycle_1.LIFECYCLE_STATUS.SOLD, lifecycle_1.LIFECYCLE_STATUS.EXPIRED, lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED],
    [lifecycle_1.LIFECYCLE_STATUS.REJECTED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING],
    [lifecycle_1.LIFECYCLE_STATUS.EXPIRED]: [lifecycle_1.LIFECYCLE_STATUS.PENDING, lifecycle_1.LIFECYCLE_STATUS.LIVE],
    [lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED]: [lifecycle_1.LIFECYCLE_STATUS.LIVE],
    [lifecycle_1.LIFECYCLE_STATUS.SOLD]: [],
};
/**
 * Resolves the logical lifecycle domain for an entity.
 * For the unified 'ad' collection, it maps to specific transition maps based on listingType.
 */
function resolveLifecycleDomain(entityDomain, listingType) {
    if (entityDomain === 'ad') {
        if (listingType === listingType_1.LISTING_TYPE.SERVICE)
            return 'service';
        if (listingType === listingType_1.LISTING_TYPE.SPARE_PART)
            return 'spare_part_listing';
        return 'ad';
    }
    return entityDomain;
}
exports.MAPS = {
    ad: exports.ALLOWED_AD_TRANSITIONS,
    user: exports.ALLOWED_USER_TRANSITIONS,
    business: exports.ALLOWED_BUSINESS_TRANSITIONS,
    service: exports.ALLOWED_SERVICE_TRANSITIONS,
    // 'catalog_part' = admin-managed SparePart catalog entity (not the marketplace SparePartListing).
    // Reuses service transitions: no SOLD state for catalog entries.
    catalog_part: exports.ALLOWED_SERVICE_TRANSITIONS,
    spare_part_listing: exports.ALLOWED_SPARE_PART_LISTING_TRANSITIONS
};
/**
 * Normalizes input status to handle legacy 'active' vs 'live' during migration.
 */
const normalizeInputStatus = (status) => {
    if (status === 'active' || status === 'approved')
        return lifecycle_1.LIFECYCLE_STATUS.LIVE;
    return status;
};
const isValidLifecycleTransition = (domain, currentStatus, nextStatus) => {
    const from = normalizeInputStatus(currentStatus);
    const to = normalizeInputStatus(nextStatus);
    return exports.MAPS[domain][from]?.includes(to) ?? false;
};
exports.isValidLifecycleTransition = isValidLifecycleTransition;
const validateTransition = (domain, currentStatus, nextStatus) => {
    if (!(0, exports.isValidLifecycleTransition)(domain, currentStatus, nextStatus)) {
        const error = new Error(`Invalid lifecycle transition in ${domain} domain: ${currentStatus} → ${nextStatus}`);
        error.statusCode = 400;
        error.code = 'INVALID_LIFECYCLE_TRANSITION';
        throw error;
    }
};
exports.validateTransition = validateTransition;
//# sourceMappingURL=LifecycleGuard.js.map