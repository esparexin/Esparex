import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Ad from '../../models/Ad';
import Report from '../../models/Report';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
import { getSingleParam } from '../../utils/requestParams';
import { logAdminAction } from '../../utils/adminLogger';
import { mutateStatus } from '../../services/StatusMutationService';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { computeActiveExpiry } from '../../services/adStatusService';
import {
    getModerationCounts,
    getModerationListingById,
    isValidListingType,
    listModerationListings,
    normalizeModerationStatusFilter,
    type ModerationListingType,
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

const resolveListingTypeFilter = (value: unknown): ModerationListingType | undefined => {
    if (!asString(value)) return undefined;
    if (!isValidListingType(value)) return undefined;
    return value;
};

const getActorId = (req: Request): string => req.user!._id.toString();

const resolveListingId = (req: Request, res: Response): string | null => {
    const id = getSingleParam(req, res, 'id', { error: 'Invalid listing id' });
    if (!id) return null;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        sendErrorResponse(req, res, 400, 'Invalid listing id');
        return null;
    }
    return id;
};

const getListingForMutation = async (req: Request, res: Response, id: string) => {
    const listing = await Ad.findById(id).select('status reviewVersion listingType').lean<{
        status: string;
        reviewVersion?: number;
        listingType?: string;
    } | null>();

    if (!listing) {
        sendErrorResponse(req, res, 404, 'Listing not found');
        return null;
    }

    return listing;
};

const buildAdminActor = (req: Request) => ({
    type: ACTOR_TYPE.ADMIN,
    id: getActorId(req),
});

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

        res.json(
            respond({
                success: true,
                data: serializeModerationListResponse({
                    items: result.data,
                    page,
                    limit,
                    total,
                    totalPages,
                }),
            })
        );
    } catch (error) {
        sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to fetch listings');
    }
};

export const adminGetListingById = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getModerationListingById(id);
        if (!listing) {
            sendErrorResponse(req, res, 404, 'Listing not found');
            return;
        }

        res.json(
            respond({
                success: true,
                data: serializeModerationDetailResponse(listing),
            })
        );
    } catch (error) {
        sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to fetch listing');
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
            sendErrorResponse(req, res, 409, 'Conflict: listing was edited while under review');
            return;
        }

        const approvedAt = new Date();
        const expiresAt = computeActiveExpiry(listing.listingType || 'ad');

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

        res.json(
            respond({
                success: true,
                data: serializeLifecycleActionResponse({
                    action: 'approved',
                    listing: updated,
                    message: 'Listing approved successfully',
                }),
            })
        );
    } catch (error: unknown) {
        const statusCode = typeof (error as { statusCode?: number })?.statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        sendErrorResponse(req, res, statusCode, error instanceof Error ? error.message : 'Failed to approve listing');
    }
};

export const adminRejectListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const rejectionReason = asString(req.body?.rejectionReason);
        if (!rejectionReason) {
            sendErrorResponse(req, res, 400, 'Rejection reason is required');
            return;
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

        res.json(
            respond({
                success: true,
                data: serializeLifecycleActionResponse({
                    action: 'rejected',
                    listing: updated,
                    message: 'Listing rejected successfully',
                }),
            })
        );
    } catch (error: unknown) {
        const statusCode = typeof (error as { statusCode?: number })?.statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        sendErrorResponse(req, res, statusCode, error instanceof Error ? error.message : 'Failed to reject listing');
    }
};

export const adminDeactivateListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

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

        res.json(
            respond({
                success: true,
                data: serializeLifecycleActionResponse({
                    action: 'deactivated',
                    listing: updated,
                    message: 'Listing deactivated successfully',
                }),
            })
        );
    } catch (error: unknown) {
        const statusCode = typeof (error as { statusCode?: number })?.statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        sendErrorResponse(req, res, statusCode, error instanceof Error ? error.message : 'Failed to deactivate listing');
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

        res.json(
            respond({
                success: true,
                data: serializeLifecycleActionResponse({
                    action: 'expired',
                    listing: updated,
                    message: 'Listing expired successfully',
                }),
            })
        );
    } catch (error: unknown) {
        const statusCode = typeof (error as { statusCode?: number })?.statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        sendErrorResponse(req, res, statusCode, error instanceof Error ? error.message : 'Failed to expire listing');
    }
};

export const adminSoftDeleteListing = async (req: Request, res: Response) => {
    try {
        const id = resolveListingId(req, res);
        if (!id) return;

        if (req.body?.hardDelete === true) {
            sendErrorResponse(req, res, 400, 'Hard delete is forbidden. Listings must be soft deleted.');
            return;
        }

        const listing = await getListingForMutation(req, res, id);
        if (!listing) return;

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

        res.json(
            respond({
                success: true,
                data: serializeLifecycleActionResponse({
                    action: 'deleted',
                    listing: updated,
                    message: 'Listing soft deleted successfully',
                }),
            })
        );
    } catch (error: unknown) {
        const statusCode = typeof (error as { statusCode?: number })?.statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        sendErrorResponse(req, res, statusCode, error instanceof Error ? error.message : 'Failed to delete listing');
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
            sendErrorResponse(req, res, 400, 'Invalid action. Allowed: dismiss, take_down, warn_user');
            return;
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

        res.json(
            respond({
                success: true,
                data: serializeLifecycleActionResponse({
                    action: 'report_resolved',
                    listing: listingResult,
                    message: 'Listing reports resolved successfully',
                    metadata: {
                        resolvedReports: reportResult.modifiedCount,
                        action,
                    },
                }),
            })
        );
    } catch (error: unknown) {
        const statusCode = typeof (error as { statusCode?: number })?.statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        sendErrorResponse(req, res, statusCode, error instanceof Error ? error.message : 'Failed to resolve listing reports');
    }
};

export const adminGetListingCounts = async (req: Request, res: Response) => {
    try {
        const listingType = resolveListingTypeFilter(req.query.listingType);
        const counts = await getModerationCounts(listingType);

        res.json(
            respond({
                success: true,
                data: serializeListingCountsResponse(counts),
            })
        );
    } catch (error) {
        sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to fetch listing counts');
    }
};

export const adminGetListingCountsLegacyAdapter = async (req: Request, res: Response) => {
    try {
        const listingType = resolveListingTypeFilter(req.query.listingType);
        const counts = await getModerationCounts(listingType);

        res.json(
            respond({
                success: true,
                data: serializeLegacyCountsAdapter(counts),
            })
        );
    } catch (error) {
        sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to fetch listing summary');
    }
};
