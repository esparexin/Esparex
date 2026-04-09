import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Ad from '../../models/Ad';
import Report from '../../models/Report';
import { 
    sendSuccessResponse, 
    sendAdminError 
} from './adminBaseController';
import { getSingleParam } from '../../utils/requestParams';
import { logAdminAction } from '../../utils/adminLogger';
import { mutateStatus } from '../../services/StatusMutationService';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { computeActiveExpiry } from '../../services/adStatusService';
import { LISTING_TYPE, type ListingTypeValue } from '../../../../shared/enums/listingType';
import {
    getModerationCounts,
    getModerationListingById,
    isValidListingType,
    listModerationListings,
    normalizeModerationStatusFilter,
} from '../../services/ListingModerationQueryService';
import {
    serializeLegacyCountsAdapter,
    serializeLifecycleActionResponse,
    serializeListingCountsResponse,
    serializeModerationDetailResponse,
    serializeModerationListResponse,
} from './listingModerationSerializer';
import { REPORT_STATUS } from '../../../../shared/enums/reportStatus';

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
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};



const toControllerError = (status: number, message: string, code?: string) => {
    const error = new Error(message);
    (error as any).status = status;
    (error as any).code = code;
    return error;
};

const resolveListingTypeFilter = (raw: unknown): ListingTypeValue | undefined => {
    const val = typeof raw === 'string' ? raw.trim().toLowerCase() : undefined;
    return val && isValidListingType(val) ? (val as ListingTypeValue) : undefined;
};

const getActorId = (req: Request): string => {
    const rawActorId = req.user?._id ?? req.user?.id;

    if (typeof rawActorId === 'string' && rawActorId.trim().length > 0) {
        return rawActorId;
    }

    if (rawActorId && typeof (rawActorId as { toString?: () => string }).toString === 'function') {
        const normalized = (rawActorId as { toString: () => string }).toString();
        if (normalized && normalized !== '[object Object]') {
            return normalized;
        }
    }

    throw toControllerError(401, 'Unauthorized admin context', 'ADMIN_ACTOR_MISSING');
};

const resolveListingId = (req: Request, res: Response): string | null => {
    const id = getSingleParam(req, res, 'id', { error: 'Invalid listing id' });
    if (!id) return null;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        sendAdminError(req, res, 'Invalid listing id', 400);
        return null;
    }
    return id;
};

const getListingForMutation = async (req: Request, res: Response, id: string) => {
    const listing = await Ad.findById(id).select('status reviewVersion listingType isDeleted').lean<{
        status: string;
        reviewVersion?: number;
        listingType?: string;
        isDeleted?: boolean;
    } | null>();

    if (!listing) {
        sendAdminError(req, res, 'Listing not found', 404);
        return null;
    }

    return listing;
};

const buildAdminActor = (req: Request) => ({
    type: ACTOR_TYPE.ADMIN,
    id: getActorId(req),
});

const sendLifecycleResponse = (
    res: Response,
    action: 'approved' | 'rejected' | 'deactivated' | 'expired' | 'extended' | 'deleted' | 'report_resolved',
    listing: unknown,
    message: string
) => {
    sendSuccessResponse(res, serializeLifecycleActionResponse({ action, listing, message }));
};

export const adminListListings = async (req: Request, res: Response) => {
    try {
        const page = parsePositiveInt(req.query.page, 1, { min: 1, max: 100000 });
        const limit = parsePositiveInt(req.query.limit, 20, { min: 1, max: 100 });

        const listingType = resolveListingTypeFilter(req.query.listingType);

        const result = await listModerationListings(
            {
                status: normalizeModerationStatusFilter(asString(req.query.status)),
                sellerId: asString(req.query.sellerId),
                categoryId: asString(req.query.categoryId),
                brandId: asString(req.query.brandId),
                modelId: asString(req.query.modelId),
                location: asString(req.query.location),
                search: asString(req.query.search),
                minPrice: asNumber(req.query.minPrice),
                maxPrice: asNumber(req.query.maxPrice),
                createdAfter: asString(req.query.createdAfter),
                createdBefore: asString(req.query.createdBefore),
                listingType,
                sortBy: asString(req.query.sortBy) as any,
            },
            { page, limit }
        );

        const total = result.pagination.total || 0;
        const totalPages = result.pagination.totalPages || Math.max(1, Math.ceil(total / Math.max(1, limit)));

        return sendSuccessResponse(res, serializeModerationListResponse({
            items: result.data,
            page,
            limit,
            total,
            totalPages,
        }));
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

export const adminGetListingById = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getModerationListingById(id);
        if (!listing) {
            return sendAdminError(req, res, 'Listing not found', 404);
        }

        return sendSuccessResponse(res, serializeModerationDetailResponse(listing));
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

export const adminApproveListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

        const requestedReviewVersion = req.body?.reviewVersion;
        if (
            typeof requestedReviewVersion === 'number'
            && typeof listing.reviewVersion === 'number'
            && requestedReviewVersion !== listing.reviewVersion
        ) {
            return sendAdminError(req, res, 'Conflict: listing was edited while under review', 409);
        }

        const approvedAt = new Date();
        const expiresAt = await computeActiveExpiry((listing.listingType as ListingTypeValue) || LISTING_TYPE.AD);

        const updated = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.LIVE,
            actor: buildAdminActor(req),
            reason: 'Approved by moderation',
            metadata: {
                action: 'moderation_approve',
                sourceRoute: '/api/v1/admin/listings/:id/approve',
                listingType: listing.listingType || 'ad',
            },
            patch: {
                moderatorId: getActorId(req),
                approvedAt,
                approvedBy: getActorId(req),
                expiresAt,
                moderationStatus: 'manual_approved',
                rejectionReason: undefined,
                $push: {
                    timeline: {
                        status: AD_STATUS.LIVE,
                        timestamp: approvedAt,
                        reason: 'Approved by moderation',
                    },
                },
            },
        });

        await logAdminAction(req, 'LISTING_APPROVE', 'Ad', id, { status: AD_STATUS.LIVE });

        sendLifecycleResponse(res, 'approved', updated, 'Listing approved successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminRejectListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const rejectionReason = asString(req.body?.rejectionReason);
        if (!rejectionReason) {
            return sendAdminError(req, res, 'Rejection reason is required', 400);
        }

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

        const updated = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.REJECTED,
            actor: buildAdminActor(req),
            reason: rejectionReason,
            metadata: {
                action: 'moderation_reject',
                sourceRoute: '/api/v1/admin/listings/:id/reject',
            },
            patch: {
                rejectionReason,
                moderatorId: getActorId(req),
                moderationStatus: 'rejected',
                $push: {
                    timeline: {
                        status: AD_STATUS.REJECTED,
                        timestamp: new Date(),
                        reason: rejectionReason,
                    },
                },
            },
        });

        await logAdminAction(req, 'LISTING_REJECT', 'Ad', id, { rejectionReason });

        sendLifecycleResponse(res, 'rejected', updated, 'Listing rejected successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminDeactivateListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

        if (listing.status === AD_STATUS.DEACTIVATED) {
            const currentListing = await getModerationListingById(id);

            sendLifecycleResponse(
                res,
                'deactivated',
                currentListing || {
                    id,
                    status: AD_STATUS.DEACTIVATED,
                    listingType: listing.listingType || 'ad',
                },
                'Listing is already deactivated'
            );
            return;
        }

        const updated = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.DEACTIVATED,
            actor: buildAdminActor(req),
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
                        status: AD_STATUS.DEACTIVATED,
                        timestamp: new Date(),
                        reason: 'Deactivated by moderation',
                    },
                },
            },
        });

        await logAdminAction(req, 'LISTING_DEACTIVATE', 'Ad', id, {});

        sendLifecycleResponse(res, 'deactivated', updated, 'Listing deactivated successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminExpireListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

        const updated = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.EXPIRED,
            actor: buildAdminActor(req),
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
                        status: AD_STATUS.EXPIRED,
                        timestamp: new Date(),
                        reason: 'Expired by moderation',
                    },
                },
            },
        });

        await logAdminAction(req, 'LISTING_EXPIRE', 'Ad', id, {});

        sendLifecycleResponse(res, 'expired', updated, 'Listing expired successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminExtendListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

        const newExpiresAt = await computeActiveExpiry((listing.listingType as ListingTypeValue) || LISTING_TYPE.AD);
        const now = new Date();
        const isExpired = listing.status === AD_STATUS.EXPIRED;
        let updated: unknown;

        if (isExpired) {
            // Expired -> live must go through governed status mutation so policy,
            // history, and moderation audit are consistently enforced.
            const actorId = getActorId(req);
            updated = await mutateStatus({
                domain: 'ad',
                entityId: id,
                toStatus: AD_STATUS.LIVE,
                actor: buildAdminActor(req),
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
                            status: AD_STATUS.LIVE,
                            timestamp: now,
                            reason: 'Expiry extended by admin',
                        },
                    },
                },
            });
        } else {
            updated = await Ad.findByIdAndUpdate(
                id,
                {
                    expiresAt: newExpiresAt,
                    $push: {
                        timeline: {
                            status: listing.status,
                            timestamp: now,
                            reason: 'Expiry extended by admin',
                        },
                    },
                },
                { new: true }
            );
        }

        await logAdminAction(req, 'LISTING_EXTEND', 'Ad', id, { expiresAt: newExpiresAt });

        sendLifecycleResponse(res, 'extended', updated, 'Listing expiry extended successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};
export const adminSoftDeleteListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        if (req.body?.hardDelete === true) {
            return sendAdminError(req, res, 'Hard delete is forbidden. Listings must be soft deleted.', 400);
        }

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

        if (listing.isDeleted) {
            const currentListing = await getModerationListingById(id);

            sendLifecycleResponse(
                res,
                'deleted',
                currentListing || {
                    id,
                    status: listing.status,
                    listingType: listing.listingType || 'ad',
                    isDeleted: true,
                },
                'Listing is already deleted'
            );
            return;
        }

        const updated = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.DEACTIVATED,
            actor: buildAdminActor(req),
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
                        status: AD_STATUS.DEACTIVATED,
                        timestamp: new Date(),
                        reason: 'Soft deleted by moderation',
                    },
                },
            },
        });

        await logAdminAction(req, 'LISTING_SOFT_DELETE', 'Ad', id, { isDeleted: true });

        sendLifecycleResponse(res, 'deleted', updated, 'Listing soft deleted successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminResolveListingReport = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

        const action = asString(req.body?.action) || 'dismiss';
        const note = asString(req.body?.note);

        if (!['dismiss', 'take_down', 'warn_user'].includes(action)) {
            return sendAdminError(req, res, 'Invalid action. Allowed: dismiss, take_down, warn_user', 400);
        }

        let listingResult: unknown = await getModerationListingById(id);

        if (action === 'take_down') {
            listingResult = await mutateStatus({
                domain: 'ad',
                entityId: id,
                toStatus: AD_STATUS.REJECTED,
                actor: buildAdminActor(req),
                reason: note || 'Taken down from reports queue',
                metadata: {
                    action: 'moderation_report_take_down',
                    sourceRoute: '/api/v1/admin/listings/:id/report-resolve',
                },
                patch: {
                    rejectionReason: note || 'Taken down from reports queue',
                    moderatorId: getActorId(req),
                },
            });
        }

        const listingObjectId = new mongoose.Types.ObjectId(id);
        const resolvedStatus = action === 'dismiss'
            ? REPORT_STATUS.DISMISSED
            : REPORT_STATUS.RESOLVED;

        const reportResult = await Report.updateMany(
            {
                $or: [
                    { targetType: 'ad', targetId: listingObjectId },
                    { adId: listingObjectId },
                ],
                status: { $in: [REPORT_STATUS.OPEN, REPORT_STATUS.PENDING, REPORT_STATUS.REVIEWED] },
            },
            {
                $set: {
                    status: resolvedStatus,
                    resolution: note,
                    resolvedBy: new mongoose.Types.ObjectId(getActorId(req)),
                    resolvedAt: new Date(),
                },
            }
        );

        await logAdminAction(req, 'LISTING_REPORT_RESOLVE', 'Ad', id, {
            action,
            note,
            resolvedReports: reportResult.modifiedCount,
        });

        return sendSuccessResponse(res, listingResult, 'Reports resolved successfully');
    } catch (error: unknown) {
        return sendAdminError(req, res, error);
    }
};

export const adminGetListingCounts = async (req: Request, res: Response) => {
    try {
        const listingType = resolveListingTypeFilter(req.query.listingType);
        const counts = await getModerationCounts(listingType);

        sendSuccessResponse(res, serializeListingCountsResponse(counts));
    } catch (error) {
        sendAdminError(req, res, error, 500);
    }
};

export const adminGetListingCountsLegacyAdapter = async (req: Request, res: Response) => {
    try {
        const listingType = resolveListingTypeFilter(req.query.listingType);
        const counts = await getModerationCounts(listingType);

        sendSuccessResponse(res, serializeLegacyCountsAdapter(counts));
    } catch (error) {
        sendAdminError(req, res, error, 500);
    }
};
