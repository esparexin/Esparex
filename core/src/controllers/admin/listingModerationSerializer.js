"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeLegacyCountsAdapter = exports.serializeListingCountsResponse = exports.serializeLifecycleActionResponse = exports.serializeModerationDetailResponse = exports.serializeModerationListResponse = exports.serializeModerationListing = void 0;
const adStatus_1 = require("@shared/enums/adStatus");
const listingType_1 = require("@shared/enums/listingType");
const MODERATION_STATUS_SET = new Set([
    adStatus_1.AD_STATUS.PENDING,
    adStatus_1.AD_STATUS.LIVE,
    adStatus_1.AD_STATUS.REJECTED,
    adStatus_1.AD_STATUS.EXPIRED,
    adStatus_1.AD_STATUS.SOLD,
    adStatus_1.AD_STATUS.DEACTIVATED,
]);
const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const throwContractError = (message, code = 'LISTING_CONTRACT_VIOLATION') => {
    const err = new Error(message);
    err.statusCode = 500;
    err.code = code;
    throw err;
};
const normalizeListingType = (value) => {
    const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (raw === listingType_1.LISTING_TYPE.AD || raw === listingType_1.LISTING_TYPE.SERVICE || raw === listingType_1.LISTING_TYPE.SPARE_PART)
        return raw;
    return throwContractError('Lifecycle contract violation (listing_type): missing/invalid listingType');
};
const assertLifecycleStatus = (status, context) => {
    const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
    if (!MODERATION_STATUS_SET.has(normalized)) {
        return throwContractError(`Lifecycle contract violation (${context}): missing/invalid status`);
    }
    return normalized;
};
const pickId = (source) => {
    const id = source.id ?? source._id;
    return typeof id === 'string' ? id : String(id || '');
};
const serializeModerationListing = (raw) => {
    if (!isRecord(raw)) {
        return throwContractError('Listing serialization failure: expected object payload', 'LISTING_SERIALIZATION_FAILED');
    }
    const rec = raw;
    return {
        ...rec,
        id: pickId(rec),
        status: assertLifecycleStatus(rec.status, 'list_item'),
        listingType: normalizeListingType(rec.listingType),
    };
};
exports.serializeModerationListing = serializeModerationListing;
const serializeModerationListResponse = (params) => {
    const items = params.items.map((item) => (0, exports.serializeModerationListing)(item));
    return {
        items,
        pagination: {
            page: params.page,
            limit: params.limit,
            total: params.total,
            totalPages: params.totalPages,
        },
    };
};
exports.serializeModerationListResponse = serializeModerationListResponse;
const serializeModerationDetailResponse = (raw) => ({
    listing: (0, exports.serializeModerationListing)(raw),
});
exports.serializeModerationDetailResponse = serializeModerationDetailResponse;
const serializeLifecycleActionResponse = (params) => ({
    action: params.action,
    message: params.message,
    listing: (0, exports.serializeModerationListing)(params.listing),
    metadata: params.metadata,
});
exports.serializeLifecycleActionResponse = serializeLifecycleActionResponse;
const serializeListingCountsResponse = (counts) => ({
    total: counts.total,
    pending: counts.pending,
    live: counts.live,
    rejected: counts.rejected,
    expired: counts.expired,
    sold: counts.sold,
    deactivated: counts.deactivated,
    byStatus: counts.byStatus,
    byListingType: counts.byListingType,
});
exports.serializeListingCountsResponse = serializeListingCountsResponse;
const serializeLegacyCountsAdapter = (counts) => ({
    total: counts.total,
    pending: counts.pending,
    live: counts.live,
    rejected: counts.rejected,
    expired: counts.expired,
    sold: counts.sold,
    deactivated: counts.deactivated,
    ad: counts.byListingType.ad,
    service: counts.byListingType.service,
    spare_part: counts.byListingType.spare_part,
});
exports.serializeLegacyCountsAdapter = serializeLegacyCountsAdapter;
//# sourceMappingURL=listingModerationSerializer.js.map