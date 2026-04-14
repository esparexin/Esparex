import mongoose from 'mongoose';
import Report, { ReportTargetTypeValue } from '../models/Report';
import Ad from '../models/Ad';
import User from '../models/User';
import Business from '../models/Business';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../utils/redisCache';
import logger from '../utils/logger';

const ACTIVE_REPORT_STATUSES = ['open', 'pending', 'reviewed'] as const;

export const checkAdExists = async (adId: string) => {
    return Ad.findById(adId).select('_id title').lean<{ _id: mongoose.Types.ObjectId; title?: string } | null>();
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

export const autoHideAdIfOverThreshold = async (
    adId: mongoose.Types.ObjectId,
    uniqueReports: number,
    threshold: number
) => {
    if (uniqueReports < threshold) return;

    await Ad.findByIdAndUpdate(adId, {
        moderationStatus: 'community_hidden',
        moderationReason: `Auto-hidden: Received ${uniqueReports} community reports (threshold: ${threshold}).`,
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
