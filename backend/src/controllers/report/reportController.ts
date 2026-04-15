import logger from '../../utils/logger';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import type { ReportTargetTypeValue } from '../../models/Report';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import { getSystemConfigDoc } from '../../utils/systemConfigHelper';
import {
    checkAdExists,
    checkUserExists,
    checkBusinessExists,
    createReport as createReportRecord,
    countActiveReports,
    autoHideAdIfOverThreshold,
} from '../../services/ReportService';

type ReportRequest = Request & {
    user?: {
        _id: string | { toString: () => string };
    };
};

const normalizeReason = (reason: string) => reason.trim();
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
            ad = await checkAdExists(canonicalTargetId);
            if (!ad) {
                return sendErrorResponse(req, res, 404, 'Ad not found');
            }
        } else if (canonicalTargetType === 'user') {
            if (canonicalTargetId === reporterId) {
                return sendErrorResponse(req, res, 400, 'You cannot report yourself');
            }
            const targetUser = await checkUserExists(canonicalTargetId);
            if (!targetUser) {
                return sendErrorResponse(req, res, 404, 'User not found');
            }
        } else if (canonicalTargetType === 'business') {
            const targetBusiness = await checkBusinessExists(canonicalTargetId);
            if (!targetBusiness) {
                return sendErrorResponse(req, res, 404, 'Business not found');
            }
        }

        const normalizedDescription = (description || additionalDetails || '').trim() || undefined;

        // Dedup is enforced by unique partial indexes at DB level.
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

            report = await createReportRecord(payload);
        } catch (err: unknown) {
            if (err instanceof Error && 'code' in err && (err as Error & { code?: number }).code === 11000) {
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

        // AUTO-HIDE THRESHOLD: configurable via SystemConfig (default: 5)
        if (canonicalTargetType === 'ad' && ad) {
            const config = await getSystemConfigDoc();
            const autoHideThreshold: number = config?.ai?.moderation?.reportAutoHideThreshold ?? 5;
            const uniqueReports = await countActiveReports('ad', ad._id);
            await autoHideAdIfOverThreshold(ad._id, uniqueReports, autoHideThreshold);
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
