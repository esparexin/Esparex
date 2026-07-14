import mongoose from 'mongoose';
import Report, { ReportTargetTypeValue } from '../models/Report';
import User from '../models/User';
import Business from '../models/Business';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../utils/redisCache';
import logger from '../utils/logger';
import { mutateStatus } from './lifecycle/StatusMutationService';
import { ACTOR_TYPE } from '@esparex/shared';
import { getListingRepository } from '../composition/listings';

const ACTIVE_REPORT_STATUSES = ['open', 'pending', 'reviewed'] as const;

export const checkAdExists = async (adId: string) => {
    const listing = await getListingRepository().findById(adId);
    if (!listing) return null;
    return { _id: new mongoose.Types.ObjectId(listing.id), title: listing.title };
};

export const checkUserExists = async (userId: string) => {
    return User.exists({
        _id: new mongoose.Types.ObjectId(userId),
        isDeleted: { $ne: true },
    });
};

export const checkBusinessExists = async (businessId: string) => {
    return Business.exists({
        _id: new mongoose.Types.ObjectId(businessId),
        isDeleted: { $ne: true },
    });
};

export const createReport = async (payload: Record<string, unknown>) => {
    return Report.create(payload);
};

export const countActiveReports = async (
    targetType: ReportTargetTypeValue,
    targetId: mongoose.Types.ObjectId
) => {
    return Report.countDocuments({
        targetType,
        targetId,
        status: { $in: ACTIVE_REPORT_STATUSES },
    });
};

export const getAdminReportById = async (id: string) => {
    return Report.findById(id)
        .populate('adId')
        .populate('reportedBy', 'firstName lastName email')
        .populate('resolvedBy', 'firstName lastName');
};

export const findReportForUpdate = async (id: string) => {
    return Report.findById(id);
};

export const saveReport = async (report: { save: () => Promise<unknown> }) => {
    return report.save();
};

export const updateReportById = async (
    id: string,
    fields: Record<string, unknown>
) => {
    return Report.findByIdAndUpdate(id, fields, { new: true });
};

export const bulkResolveReports = async (
    listingObjectId: mongoose.Types.ObjectId,
    resolvedStatus: string,
    note: string | undefined,
    actorId: string
) => {
    // 🛡️ ARCHITECTURAL EXCEPTION: Report domain is not yet centralized in StatusMutationService.
    // Raw Mongoose update is permitted for bulk Report resolution until the domain is migrated.
     
    return Report.updateMany(
        {
            $or: [
                { targetType: 'ad', targetId: listingObjectId },
                { adId: listingObjectId },
            ],
            status: { $in: ACTIVE_REPORT_STATUSES },
        },
        {
            $set: {
                status: resolvedStatus,
                resolution: note,
                resolvedBy: new mongoose.Types.ObjectId(actorId),
                resolvedAt: new Date(),
            },
        }
    );
};

export const autoHideAdIfOverThreshold = async (
    adId: mongoose.Types.ObjectId,
    uniqueReports: number,
    threshold: number
) => {
    if (uniqueReports < threshold) return;

    await mutateStatus({
        domain: 'ad',
        entityId: adId,
        toStatus: 'live', // Keeping current status, only updating moderationStatus
        actor: { type: ACTOR_TYPE.SYSTEM, id: 'system_auto_moderator' },
        reason: `Auto-hidden: Received ${uniqueReports} community reports (threshold: ${threshold}).`,
        patch: {
            moderationStatus: 'community_hidden',
        },
        metadata: {
            action: 'community_auto_hide',
            source: 'ReportService.autoHideAdIfOverThreshold',
        }
    });

    setImmediate(() => {
        invalidateAdFeedCaches().catch((err: unknown) => {
            logger.error('Failed to clear feed cache after community auto-hide', {
                error: String(err), adId: adId.toString(),
            });
        });
        invalidatePublicAdCache(adId.toString()).catch((err: unknown) => {
            logger.error('Failed to clear ad cache after community auto-hide', {
                error: String(err), adId: adId.toString(),
            });
        });
    });

    logger.warn('[FeedVisibility] Ad auto-hidden by report threshold', {
        adId: adId.toString(), uniqueReports, threshold,
    });
};
