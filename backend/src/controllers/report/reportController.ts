import logger from '../../utils/logger';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Report, { ReportTargetTypeValue } from '../../models/Report';
import Ad from '../../models/Ad';
import User from '../../models/User';
import Business from '../../models/Business';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import { getSystemConfigDoc } from '../../utils/systemConfigHelper';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../../utils/redisCache';

type ReportRequest = Request & {
    user?: {
        _id: string | { toString: () => string };
    };
};

const normalizeReason = (reason: string) => reason.trim();
const ACTIVE_REPORT_STATUSES = ['open', 'pending', 'reviewed'] as const;
const REPORTABLE_TARGET_TYPES = new Set<ReportTargetTypeValue>(['ad', 'user', 'business']);

const normalizeTargetType = (value: unknown): ReportTargetTypeValue | null => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (!REPORTABLE_TARGET_TYPES.has(normalized as ReportTargetTypeValue)) return null;
    return normalized as ReportTargetTypeValue;
};

export const createReport = async (req: Request, res: Response) => {
    try {
        const reportReq = req as ReportRequest;
        const user = reportReq.user;
        if (!user) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const {
            targetType: rawTargetType,
            targetId: rawTargetId,
            adId: rawAdId,
            adTitle,
            reason,
            description,
            additionalDetails
        } = req.body as {
            targetType?: string;
            targetId?: string;
            adId?: string;
            adTitle?: string;
            reason: string;
            description?: string;
            additionalDetails?: string;
        };

        // NOTE: Per-user hourly rate-limit is enforced by the reportLimiter
        // middleware (Redis-based). No DB countDocuments check needed here.
        const reporterId = String(user._id);
        if (!mongoose.Types.ObjectId.isValid(reporterId)) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const hasCanonicalTarget = Boolean(rawTargetType) || Boolean(rawTargetId);
        let canonicalTargetType: ReportTargetTypeValue;
        let canonicalTargetId: string;

        if (hasCanonicalTarget) {
            const normalizedTargetType = normalizeTargetType(rawTargetType);
            if (!normalizedTargetType || !rawTargetId) {
                return sendErrorResponse(req, res, 400, 'targetType and targetId are required together');
            }
            canonicalTargetType = normalizedTargetType;
            canonicalTargetId = String(rawTargetId);
        } else if (rawAdId) {
            canonicalTargetType = 'ad';
            canonicalTargetId = String(rawAdId);
        } else {
            return sendErrorResponse(req, res, 400, 'Either targetType+targetId or adId is required');
        }

        if (!mongoose.Types.ObjectId.isValid(canonicalTargetId)) {
            return sendErrorResponse(req, res, 400, 'Invalid target ID');
        }

        let ad: { _id: mongoose.Types.ObjectId; title?: string } | null = null;
        if (canonicalTargetType === 'ad') {
            ad = await Ad.findById(canonicalTargetId).select('title').lean();
            if (!ad) {
                return sendErrorResponse(req, res, 404, 'Ad not found');
            }
        } else if (canonicalTargetType === 'user') {
            if (canonicalTargetId === reporterId) {
                return sendErrorResponse(req, res, 400, 'You cannot report yourself');
            }
            const targetUser = await User.exists({
                _id: new mongoose.Types.ObjectId(canonicalTargetId),
                isDeleted: { $ne: true },
            });
            if (!targetUser) {
                return sendErrorResponse(req, res, 404, 'User not found');
            }
        } else if (canonicalTargetType === 'business') {
            const targetBusiness = await Business.exists({
                _id: new mongoose.Types.ObjectId(canonicalTargetId),
                isDeleted: { $ne: true },
            });
            if (!targetBusiness) {
                return sendErrorResponse(req, res, 404, 'Business not found');
            }
        }

        const normalizedDescription = (description || additionalDetails || '').trim() || undefined;

        // Dedup is enforced by unique partial indexes at DB level:
        // legacy { adId, reportedBy } and canonical { targetType, targetId, reporterId }
        // where status ∈ [open, pending, reviewed].
        // We rely on the 11000 duplicate key error instead of a racy findOne.
        let report;
        try {
            const payload: Record<string, unknown> = {
                targetType: canonicalTargetType,
                targetId: new mongoose.Types.ObjectId(canonicalTargetId),
                reporterId: new mongoose.Types.ObjectId(reporterId),
                reportedBy: new mongoose.Types.ObjectId(reporterId),
                reason: normalizeReason(reason),
                description: normalizedDescription,
                additionalDetails: additionalDetails?.trim() || undefined,
                status: 'open',
            };

            if (canonicalTargetType === 'ad' && ad) {
                payload.adId = ad._id;
                payload.adTitle = adTitle || ad.title;
            }

            report = await Report.create({
                ...payload
            });
        } catch (err: unknown) {
            if (err instanceof Error && 'code' in err && (err as any).code === 11000) {
                return sendErrorResponse(req, res, 409, 'You have already reported this target');
            }
            throw err;
        }

        logger.info('[ReportLifecycle] Report created', {
            reportId: report._id.toString(),
            targetType: canonicalTargetType,
            targetId: canonicalTargetId,
            reporterId,
        });

        // 🔴 AUTO-HIDE THRESHOLD: configurable via SystemConfig (default: 5)
        if (canonicalTargetType === 'ad' && ad) {
            const config = await getSystemConfigDoc();
            const autoHideThreshold: number = config?.ai?.moderation?.reportAutoHideThreshold ?? 5;

            const uniqueReports = await Report.countDocuments({
                targetType: 'ad',
                targetId: ad._id,
                status: { $in: ACTIVE_REPORT_STATUSES }
            });

            if (uniqueReports >= autoHideThreshold) {
                await Ad.findByIdAndUpdate(ad._id, {
                    // 'community_hidden' distinguishes community auto-hide from admin 'rejected'.
                    moderationStatus: 'community_hidden',
                    moderationReason: `Auto-hidden: Received ${uniqueReports} community reports (threshold: ${autoHideThreshold}).`
                });

                setImmediate(() => {
                    invalidateAdFeedCaches().catch((err: unknown) => {
                        logger.error('Failed to clear feed cache after community auto-hide', {
                            error: String(err),
                            adId: ad._id.toString()
                        });
                    });
                    invalidatePublicAdCache(ad._id.toString()).catch((err: unknown) => {
                        logger.error('Failed to clear ad cache after community auto-hide', {
                            error: String(err),
                            adId: ad._id.toString()
                        });
                    });
                });

                logger.warn('[FeedVisibility] Ad auto-hidden by report threshold', {
                    adId: ad._id.toString(),
                    uniqueReports,
                    autoHideThreshold
                });
            }
        }

        return res.status(201).json(respond<ApiResponse<unknown>>({
            success: true,
            data: report
        }));
    } catch (error: unknown) {
        logger.error('Create Report Error:', error);
        return sendErrorResponse(req, res, 500, 'Failed to submit report');
    }
};
