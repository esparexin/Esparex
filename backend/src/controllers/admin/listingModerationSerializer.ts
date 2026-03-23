import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import type {
    ModerationListingType,
    ModerationStatus,
} from '../../services/ListingModerationQueryService';

const MODERATION_STATUS_SET = new Set<ModerationStatus>([
    AD_STATUS.PENDING,
    AD_STATUS.LIVE,
    AD_STATUS.REJECTED,
    AD_STATUS.EXPIRED,
    AD_STATUS.SOLD,
    AD_STATUS.DEACTIVATED,
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeListingType = (value: unknown): ModerationListingType => {
    const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (raw === LISTING_TYPE.AD || raw === LISTING_TYPE.SERVICE || raw === LISTING_TYPE.SPARE_PART) return raw;

    const err = new Error('Lifecycle contract violation (listing_type): missing/invalid listingType');
    (err as Error & { statusCode?: number; code?: string }).statusCode = 500;
    (err as Error & { statusCode?: number; code?: string }).code = 'LISTING_CONTRACT_VIOLATION';
    throw err;
};

const assertLifecycleStatus = (status: unknown, context: string): ModerationStatus => {
    const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
    if (!MODERATION_STATUS_SET.has(normalized as ModerationStatus)) {
        const err = new Error(`Lifecycle contract violation (${context}): missing/invalid status`);
        (err as Error & { statusCode?: number; code?: string }).statusCode = 500;
        (err as Error & { statusCode?: number; code?: string }).code = 'LISTING_CONTRACT_VIOLATION';
        throw err;
    }

    return normalized as ModerationStatus;
};

const pickId = (source: Record<string, unknown>): string => {
    const id = source.id ?? source._id;
    return typeof id === 'string' ? id : String(id || '');
};

export const serializeModerationListing = (raw: unknown) => {
    if (!isRecord(raw)) {
        const err = new Error('Listing serialization failure: expected object payload');
        (err as Error & { statusCode?: number; code?: string }).statusCode = 500;
        (err as Error & { statusCode?: number; code?: string }).code = 'LISTING_SERIALIZATION_FAILED';
        throw err;
    }

    return {
        ...raw,
        id: pickId(raw),
        status: assertLifecycleStatus(raw.status, 'list_item'),
        listingType: normalizeListingType(raw.listingType),
    };
};

export const serializeModerationListResponse = (params: {
    items: unknown[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}) => {
    const items = params.items.map((item) => serializeModerationListing(item));

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

export const serializeModerationDetailResponse = (raw: unknown) => ({
    listing: serializeModerationListing(raw),
});

export const serializeLifecycleActionResponse = (params: {
    action: 'approved' | 'rejected' | 'deactivated' | 'expired' | 'extended' | 'deleted' | 'report_resolved';
    listing: unknown;
    message: string;
    metadata?: Record<string, unknown>;
}) => ({
    action: params.action,
    message: params.message,
    listing: serializeModerationListing(params.listing),
    metadata: params.metadata,
});

export const serializeListingCountsResponse = (counts: {
    total: number;
    pending: number;
    live: number;
    rejected: number;
    expired: number;
    sold: number;
    deactivated: number;
    byStatus: {
        pending: number;
        live: number;
        rejected: number;
        expired: number;
        sold: number;
        deactivated: number;
    };
    byListingType: Record<ModerationListingType, {
        total: number;
        pending: number;
        live: number;
        rejected: number;
        expired: number;
        sold: number;
        deactivated: number;
    }>;
}) => ({
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

export const serializeLegacyCountsAdapter = (counts: {
    total: number;
    pending: number;
    live: number;
    rejected: number;
    expired: number;
    sold: number;
    deactivated: number;
    byListingType: Record<ModerationListingType, {
        total: number;
        pending: number;
        live: number;
        rejected: number;
        expired: number;
        sold: number;
        deactivated: number;
    }>;
}) => ({
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
