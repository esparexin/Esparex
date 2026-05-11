import mongoose from 'mongoose';
import { getAdForModerationById } from './ad/AdDetailService';
import { extendListingExpiry } from './AdMutationService';
import { bulkResolveReports } from './ReportService';
import type { AdminLogTargetType } from '../utils/adminLogger';
import { mutateStatus } from './StatusMutationService';
import { ACTOR_TYPE } from '../constants/enums/actor';
import { LISTING_STATUS } from "../constants/enums/listingStatus";
import { computeActiveExpiry } from './AdStatusService';
import { LISTING_TYPE, type ListingTypeValue } from '../constants/enums/listingType';
import { updateAdTransactional } from './AdMutationService';
import { createAd } from './AdOrchestrator';
import {
    getModerationCounts,
    getModerationListingById,
    isValidListingType,
    listModerationListings,
    normalizeModerationStatusFilter,
    type ListingModerationFilters,
} from './ListingModerationQueryService';
import { REPORT_STATUS } from '../constants/enums/reportStatus';
import { AppError } from '../utils/AppError';
import Ad from '../models/Ad';
import { dispatchTemplatedNotification } from './NotificationService';

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------

/**
 * AdminLogFn — injected by the controller so the service has
 * zero dependency on express.Request or adminLogger.
 * Defined explicitly; NOT derived from the req-based logAdminAction.
 */
export type AdminLogFn = (
    action: string,
    targetType: AdminLogTargetType,
    targetId: string,
    metadata?: Record<string, unknown>
) => Promise<void>;

export interface AdminListingsQuery {
    page?: unknown;
    limit?: unknown;
    status?: unknown;
    sellerId?: unknown;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    locationId?: unknown;
    q?: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
    createdAfter?: unknown;
    createdBefore?: unknown;
    listingType?: unknown;
    sortBy?: unknown;
    expiryWarningStatus?: unknown;
    expiringWithinDays?: unknown;
    spotlightWarningStatus?: unknown;
    spotlightExpiringWithinDays?: unknown;
}

type DuplicateBypassBody = {
    allowDuplicateBypass?: unknown;
    duplicateBypassReason?: unknown;
};

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const parsePositiveInt = (value: unknown, fallback: number, bounds: { min: number; max: number }) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const normalized = Math.floor(parsed);
    if (normalized < bounds.min) return bounds.min;
    if (normalized > bounds.max) return bounds.max;
    return normalized;
};

const asString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDuplicateBypassPayload = (body?: DuplicateBypassBody) => {
    const allowDuplicateBypass = body?.allowDuplicateBypass === true;
    const duplicateBypassReason =
        typeof body?.duplicateBypassReason === 'string'
            ? body.duplicateBypassReason.trim()
            : '';

    return { allowDuplicateBypass, duplicateBypassReason };
};

const sanitizeDuplicateBypassPayload = (body: Record<string, unknown>) => {
    const payload = { ...body };
    delete payload.allowDuplicateBypass;
    delete payload.duplicateBypassReason;
    return payload;
};

const validateDuplicateBypass = (allowDuplicateBypass: boolean, duplicateBypassReason: string) => {
    if (allowDuplicateBypass && duplicateBypassReason.length < 12) {
        throw new AppError('A detailed duplicate bypass reason (minimum 12 characters) is required.', 400);
    }
};

const resolveListingTypeFilter = (raw: unknown): ListingTypeValue | undefined => {
    const val = typeof raw === 'string' ? raw.trim().toLowerCase() : undefined;
    return val && isValidListingType(val) ? (val) : undefined;
};

const buildAdminActor = (actorId: string) => ({
    type: ACTOR_TYPE.ADMIN,
    id: actorId,
});

const validateListingId = (id: string): string => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid listing id', 400);
    }
    return id;
};

const getListingForMutation = async (id: string) => {
    const listing = await getAdForModerationById(id);
    if (!listing) {
        throw new AppError('Listing not found', 404);
    }
    return listing;
};

// ---------------------------------------------------------
// Service Methods
// ---------------------------------------------------------

export const adminListListings = async (query: AdminListingsQuery) => {
    const page = parsePositiveInt(query.page, 1, { min: 1, max: 100000 });
    const limit = parsePositiveInt(query.limit, 20, { min: 1, max: 100 });
    const listingType = resolveListingTypeFilter(query.listingType);

    const result = await listModerationListings(
        {
            status: normalizeModerationStatusFilter(asString(query.status)),
            sellerId: asString(query.sellerId),
            categoryId: asString(query.categoryId),
            brandId: asString(query.brandId),
            modelId: asString(query.modelId),
            locationId: asString(query.locationId),
            q: asString(query.q),
            minPrice: asNumber(query.minPrice),
            maxPrice: asNumber(query.maxPrice),
            createdAfter: asString(query.createdAfter),
            createdBefore: asString(query.createdBefore),
            listingType,
            sortBy: asString(query.sortBy) as ListingModerationFilters['sortBy'],
            expiryWarningStatus: asString(query.expiryWarningStatus) as ListingModerationFilters['expiryWarningStatus'],
            expiringWithinDays: asNumber(query.expiringWithinDays),
            spotlightWarningStatus: asString(query.spotlightWarningStatus) as ListingModerationFilters['spotlightWarningStatus'],
            spotlightExpiringWithinDays: asNumber(query.spotlightExpiringWithinDays),
        },
        { page, limit }
    );

    const total = result.pagination.total || 0;
    const totalPages = result.pagination.totalPages || Math.max(1, Math.ceil(total / Math.max(1, limit)));

    return {
        items: result.data,
        page,
        limit,
        total,
        totalPages,
    };
};

export const adminGetListingById = async (id: string) => {
    validateListingId(id);
    const listing = await getModerationListingById(id);
    if (!listing) {
        throw new AppError('Listing not found', 404);
    }
    return listing;
};

export const adminCreateListing = async (
    actorId: string,
    body: unknown,
    logFn: AdminLogFn
) => {
    const safeBody = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(
        safeBody
    );
    validateDuplicateBypass(allowDuplicateBypass, duplicateBypassReason);

    const payload = sanitizeDuplicateBypassPayload(safeBody);

    const ad = await createAd(payload, {
        actor: 'ADMIN',
        authUserId: actorId,
        sellerId: actorId,
        allowQuotaBypass: true,
    });

    if (!ad) {
        throw new AppError('Failed to create listing', 500);
    }

    const createdAdId = ((ad as unknown as { _id?: unknown })._id ?? '').toString();
    if (!createdAdId) {
        throw new AppError('Created listing id is missing', 500);
    }

    await logFn('CREATE_LISTING', 'Ad', createdAdId, {
        ...payload,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });

    await logFn('SLOT_QUOTA_BYPASS', 'Ad', createdAdId, {
        via: 'adminCreateListing',
        reason: 'Admin quota bypass — admin actor',
        adminId: actorId,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });

    return ad;
};

export const adminUpdateListing = async (
    id: string,
    actorId: string,
    body: unknown,
    logFn: AdminLogFn
) => {
    validateListingId(id);
    const safeBody = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(
        safeBody
    );
    validateDuplicateBypass(allowDuplicateBypass, duplicateBypassReason);

    const payload = sanitizeDuplicateBypassPayload(safeBody);
    const restPayload = { ...payload };
    delete restPayload.status;
    delete restPayload.rejectionReason;

    const updatedAd = await updateAdTransactional({
        adId: id,
        patch: restPayload,
        context: {
            actor: 'ADMIN',
            authUserId: actorId,
            sellerId: actorId,
            allowQuotaBypass: true,
            allowDuplicateBypass,
            duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
        }
    });

    await logFn('UPDATE_LISTING', 'Ad', id, {
        ...restPayload,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });

    await logFn('SLOT_QUOTA_BYPASS', 'Ad', id, {
        via: 'adminUpdateListing',
        reason: 'Admin quota bypass — admin actor',
        adminId: actorId,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });

    return updatedAd;
};

export const adminApproveListing = async (
    id: string,
    actorId: string,
    logFn: AdminLogFn,
    reviewVersion?: number
) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);

    if (
        typeof reviewVersion === 'number'
        && typeof listing.reviewVersion === 'number'
        && reviewVersion !== listing.reviewVersion
    ) {
        throw new AppError('Conflict: listing was edited while under review', 409);
    }

    const approvedAt = new Date();
    const expiresAt = await computeActiveExpiry((listing.listingType as ListingTypeValue) || LISTING_TYPE.AD);

    const updated = await mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: LISTING_STATUS.LIVE,
        actor: buildAdminActor(actorId),
        reason: 'Approved by moderation',
        metadata: {
            action: 'moderation_approve',
            sourceRoute: '/api/v1/admin/listings/:id/approve',
            listingType: listing.listingType || 'ad',
        },
        patch: {
            moderatorId: actorId,
            approvedAt,
            approvedBy: actorId,
            expiresAt,
            expiryWarningSentAt: null,
            expiryWarningCount: 0,
            lastExpiryWarningChannel: null,
            moderationStatus: 'manual_approved',
            rejectionReason: undefined,
            $push: {
                timeline: {
                    status: LISTING_STATUS.LIVE,
                    timestamp: approvedAt,
                    reason: 'Approved by moderation',
                },
            },
        },
    });

    await logFn('LISTING_APPROVE', 'Ad', id, { status: LISTING_STATUS.LIVE });
    return updated;
};

export const adminRejectListing = async (
    id: string,
    actorId: string,
    rejectionReason: string,
    logFn: AdminLogFn
) => {
    validateListingId(id);
    if (!rejectionReason || !rejectionReason.trim()) {
        throw new AppError('Rejection reason is required', 400);
    }

    await getListingForMutation(id);

    const updated = await mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: LISTING_STATUS.REJECTED,
        actor: buildAdminActor(actorId),
        reason: rejectionReason,
        metadata: {
            action: 'moderation_reject',
            sourceRoute: '/api/v1/admin/listings/:id/reject',
        },
        patch: {
            rejectionReason,
            moderatorId: actorId,
            moderationStatus: 'rejected',
            $push: {
                timeline: {
                    status: LISTING_STATUS.REJECTED,
                    timestamp: new Date(),
                    reason: rejectionReason,
                },
            },
        },
    });

    await logFn('LISTING_REJECT', 'Ad', id, { rejectionReason });
    return updated;
};

export const adminDeactivateListing = async (
    id: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);

    if (listing.status === LISTING_STATUS.DEACTIVATED) {
        const currentListing = await getModerationListingById(id);
        return { action: 'deactivated', listing: currentListing || { id, status: LISTING_STATUS.DEACTIVATED, listingType: listing.listingType || 'ad' }, message: 'Listing is already deactivated' };
    }

    const updated = await mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: LISTING_STATUS.DEACTIVATED,
        actor: buildAdminActor(actorId),
        reason: 'Deactivated by moderation',
        metadata: {
            action: 'moderation_deactivate',
            sourceRoute: '/api/v1/admin/listings/:id/deactivate',
        },
        patch: {
            isSpotlight: false,
            isChatLocked: true,
            $push: {
                timeline: {
                    status: LISTING_STATUS.DEACTIVATED,
                    timestamp: new Date(),
                    reason: 'Deactivated by moderation',
                },
            },
        },
    });

    await logFn('LISTING_DEACTIVATE', 'Ad', id, {});
    return { action: 'deactivated', listing: updated, message: 'Listing deactivated successfully' };
};

export const adminExpireListing = async (
    id: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    validateListingId(id);
    await getListingForMutation(id);

    const updated = await mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: LISTING_STATUS.EXPIRED,
        actor: buildAdminActor(actorId),
        reason: 'Expired by moderation',
        metadata: {
            action: 'moderation_expire',
            sourceRoute: '/api/v1/admin/listings/:id/expire',
        },
        patch: {
            isSpotlight: false,
            isChatLocked: true,
            $push: {
                timeline: {
                    status: LISTING_STATUS.EXPIRED,
                    timestamp: new Date(),
                    reason: 'Expired by moderation',
                },
            },
        },
    });

    await logFn('LISTING_EXPIRE', 'Ad', id, {});
    return updated;
};

export const adminExtendListing = async (
    id: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);

    const newExpiresAt = await computeActiveExpiry((listing.listingType as ListingTypeValue) || LISTING_TYPE.AD);
    const now = new Date();
    const isExpired = listing.status === LISTING_STATUS.EXPIRED;
    let updated: unknown;

    if (isExpired) {
        updated = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: LISTING_STATUS.LIVE,
            actor: buildAdminActor(actorId),
            reason: 'Expiry extended by admin',
            metadata: {
                action: 'moderation_approve',
                sourceRoute: '/api/v1/admin/listings/:id/extend',
                listingType: listing.listingType || 'ad',
            },
            patch: {
                approvedAt: now,
                approvedBy: actorId,
                expiresAt: newExpiresAt,
                isChatLocked: false,
                moderationStatus: 'manual_approved',
                $push: {
                    timeline: {
                        status: LISTING_STATUS.LIVE,
                        timestamp: now,
                        reason: 'Expiry extended by admin',
                    },
                },
            },
        });
    } else {
        updated = await extendListingExpiry(id, newExpiresAt, listing.status, now);
    }

    await logFn('LISTING_EXTEND', 'Ad', id, { expiresAt: newExpiresAt });
    return updated;
};

export const adminSoftDeleteListing = async (
    id: string,
    actorId: string,
    logFn: AdminLogFn,
    hardDelete?: boolean
) => {
    validateListingId(id);
    if (hardDelete === true) {
        throw new AppError('Hard delete is forbidden. Listings must be soft deleted.', 400);
    }

    const listing = await getListingForMutation(id);
    if (listing.isDeleted) {
        const currentListing = await getModerationListingById(id);
        return {
            action: 'deleted',
            listing: currentListing || { id, status: listing.status, listingType: listing.listingType || 'ad', isDeleted: true },
            message: 'Listing is already deleted'
        };
    }

    const updated = await mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: LISTING_STATUS.DEACTIVATED,
        actor: buildAdminActor(actorId),
        reason: 'Soft deleted by moderation',
        metadata: {
            action: 'moderation_soft_delete',
            sourceRoute: 'DELETE /api/v1/admin/listings/:id',
        },
        patch: {
            isDeleted: true,
            deletedAt: new Date(),
            isSpotlight: false,
            isChatLocked: true,
            $push: {
                timeline: {
                    status: LISTING_STATUS.DEACTIVATED,
                    timestamp: new Date(),
                    reason: 'Soft deleted by moderation',
                },
            },
        },
    });

    await logFn('LISTING_SOFT_DELETE', 'Ad', id, { isDeleted: true });
    return { action: 'deleted', listing: updated, message: 'Listing soft deleted successfully' };
};

export const adminResolveListingReport = async (
    id: string,
    actorId: string,
    action: string,
    note: string | undefined,
    logFn: AdminLogFn
) => {
    validateListingId(id);
    await getListingForMutation(id);

    const resolvedAction = action || 'dismiss';

    if (!['dismiss', 'take_down', 'warn_user'].includes(resolvedAction)) {
        throw new AppError('Invalid action. Allowed: dismiss, take_down, warn_user', 400);
    }

    let listingResult: unknown = await getModerationListingById(id);

    if (resolvedAction === 'take_down') {
        listingResult = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: LISTING_STATUS.REJECTED,
            actor: buildAdminActor(actorId),
            reason: note || 'Taken down from reports queue',
            metadata: {
                action: 'moderation_report_take_down',
                sourceRoute: '/api/v1/admin/listings/:id/report-resolve',
            },
            patch: {
                rejectionReason: note || 'Taken down from reports queue',
                moderatorId: actorId,
            },
        });
    }

    const listingObjectId = new mongoose.Types.ObjectId(id);
    const resolvedStatus = resolvedAction === 'dismiss'
        ? REPORT_STATUS.DISMISSED
        : REPORT_STATUS.RESOLVED;

    const reportResult = await bulkResolveReports(listingObjectId, resolvedStatus, note, actorId);

    await logFn('LISTING_REPORT_RESOLVE', 'Ad', id, {
        action: resolvedAction,
        note,
        resolvedReports: reportResult.modifiedCount,
    });

    return listingResult;
};

export const adminGetListingCounts = async (listingTypeRaw?: unknown) => {
    const listingType = resolveListingTypeFilter(listingTypeRaw);
    return getModerationCounts(listingType);
};

// ─── Bulk Moderation ─────────────────────────────────────────────────────────

export const adminBulkApproveListings = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of listing IDs is required', 400);
    }

    const results = [];
    for (const id of ids) {
        try {
            const updated = await adminApproveListing(id, actorId, logFn);
            results.push({ id, success: true, listing: updated });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error),
                statusCode: (error as { statusCode?: number }).statusCode || 500
            });
        }
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
        results
    };
};

export const adminBulkRejectListings = async (
    ids: string[],
    actorId: string,
    rejectionReason: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of listing IDs is required', 400);
    }
    if (!rejectionReason || !rejectionReason.trim()) {
        throw new AppError('Rejection reason is required for bulk rejection', 400);
    }

    const results = [];
    for (const id of ids) {
        try {
            const updated = await adminRejectListing(id, actorId, rejectionReason, logFn);
            results.push({ id, success: true, listing: updated });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error),
                statusCode: (error as { statusCode?: number }).statusCode || 500
            });
        }
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
        results
    };
};

export const adminBulkDeactivateListings = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of listing IDs is required', 400);
    }

    const results = [];
    for (const id of ids) {
        try {
            const updated = await adminDeactivateListing(id, actorId, logFn);
            results.push({ id, success: true, listing: updated.listing });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
    };
};

export const adminBulkExpireListings = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of listing IDs is required', 400);
    }

    const results = [];
    for (const id of ids) {
        try {
            const updated = await adminExpireListing(id, actorId, logFn);
            results.push({ id, success: true, listing: updated });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
    };
};

export const adminBulkExtendListings = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of listing IDs is required', 400);
    }

    const results = [];
    for (const id of ids) {
        try {
            const updated = await adminExtendListing(id, actorId, logFn);
            results.push({ id, success: true, listing: updated });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
    };
};

export const adminBulkResendListingWarnings = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of listing IDs is required', 400);
    }

    const results = [];
    for (const id of ids) {
        try {
            validateListingId(id);
            const ad = await Ad.findById(id);
            if (!ad) throw new AppError('Listing not found', 404);

            await dispatchTemplatedNotification(
                ad.sellerId.toString(),
                'SYSTEM',
                'LISTING_EXPIRY_WARNING_3D',
                { 
                    title: ad.title, 
                    date: ad.expiresAt?.toLocaleDateString() || 'N/A' 
                },
                { adId: ad._id.toString() }
            );

            ad.expiryWarningSentAt = new Date();
            ad.expiryWarningCount = (ad.expiryWarningCount || 0) + 1;
            ad.lastExpiryWarningChannel = 'in-app';
            await ad.save();

            await logFn('expiry_warning_resent', 'ExpiryWarning', id, {
                entityType: 'Ad',
                adminId: actorId
            });

            results.push({ id, success: true });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
        results
    };
};

export const adminBulkResendSpotlightWarnings = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of listing IDs is required', 400);
    }

    const results = [];
    for (const id of ids) {
        try {
            validateListingId(id);
            const ad = await Ad.findById(id);
            if (!ad) throw new AppError('Listing not found', 404);
            if (!ad.isSpotlight) throw new AppError('Listing is not in spotlight', 400);

            await dispatchTemplatedNotification(
                ad.sellerId.toString(),
                'SYSTEM',
                'SPOTLIGHT_EXPIRY_WARNING_3D',
                { 
                    title: ad.title, 
                    date: ad.spotlightExpiresAt?.toLocaleDateString() || 'N/A' 
                },
                { adId: ad._id.toString(), type: 'spotlight' }
            );

            ad.spotlightWarningSentAt = new Date();
            ad.spotlightWarningCount = (ad.spotlightWarningCount || 0) + 1;
            await ad.save();

            await logFn('expiry_warning_resent', 'SpotlightPromotion', id, {
                type: 'spotlight',
                adminId: actorId
            });

            results.push({ id, success: true });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
        results
    };
};
