import logger from '../../utils/logger';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Ad from '../../models/Ad';
import Report from '../../models/Report';
import { logAdminAction } from '../../utils/adminLogger';
import {
    isValidAdStatus,
    getAnyAdById,
    createAd,
    updateAd,
    updateAdTransactional,
    promoteAd,
    preparePayload,
    getAds,
    getAdCounts,
    computeModerationSummaryByType,
    getReportedAdsAggregation,
    computeActiveExpiry,
    getAdsByStatus,
    extendAdExpiry
} from '../../services/AdService';
import * as adStatusService from '../../services/adStatusService';
import { GOVERNANCE, MS_IN_DAY } from '../../config/constants';
import { validateTransition } from '../../services/LifecycleGuard';
import { getSingleParam } from '../../utils/requestParams';
import type { AdFilters } from '../../types/ad.types';
import {
    getPaginationParams,
    sendPaginatedResponse,
    sendSuccessResponse,
    sendAdminError
} from './adminBaseController';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../../utils/redisCache';
import { AD_STATUS, AD_STATUS_VALUES } from '../../../../shared/enums/adStatus';
import { mutateStatus } from '../../services/StatusMutationService';
import { ACTOR_TYPE } from '../../../../shared/enums/actor';
import { REPORT_STATUS } from '../../../../shared/enums/reportStatus';

type DuplicateBypassBody = {
    allowDuplicateBypass?: unknown;
    duplicateBypassReason?: unknown;
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

const validateDuplicateBypass = (
    req: Request,
    res: Response,
    allowDuplicateBypass: boolean,
    duplicateBypassReason: string
) => {
    if (allowDuplicateBypass && duplicateBypassReason.length < 12) {
        sendAdminError(
            req,
            res,
            'A detailed duplicate bypass reason (minimum 12 characters) is required.',
            400
        );
        return false;
    }
    return true;
};

// Local helper removed, using centralized sendAdminError.

const normalizeAdminAdStatusInput = (rawStatus: string): string => {
    return rawStatus.trim().toLowerCase();
};

/* ────────────────────────────────────────────── */
/* ADMIN: LIST ADS                                */
/* ────────────────────────────────────────────── */
export const adminGetAds = async (req: Request, res: Response) => {
    try {
        const {
            status,
            sellerId,
            categoryId,
            brandId,
            modelId,
            location,
            search,
            minPrice,
            maxPrice,
            createdAfter,
            createdBefore,
            flagged,
            reportThreshold,
            riskThreshold,
            listingType,
            page = 1,
            limit = 20,
            sortBy
        } = req.query;

        const normalizedStatus =
            typeof status === 'string' && status.trim().length > 0 && status !== 'all'
                ? status.trim()
                : [...AD_STATUS_VALUES];

        const result = await getAds(
            {
                status: normalizedStatus,
                sellerId: sellerId ? String(sellerId) : undefined,
                categoryId: categoryId ? String(categoryId) : undefined,
                brandId: brandId ? String(brandId) : undefined,
                modelId: modelId ? String(modelId) : undefined,
                location: location ? String(location) : undefined,
                search: search ? String(search) : undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                createdAfter: createdAfter ? String(createdAfter) : undefined,
                createdBefore: createdBefore ? String(createdBefore) : undefined,
                flagged: flagged === 'true',
                reportThreshold: reportThreshold ? Number(reportThreshold) : undefined,
                riskThreshold: riskThreshold ? Number(riskThreshold) : undefined,
                listingType: listingType ? (listingType as any) : undefined,
                sortBy: sortBy ? (String(sortBy) as AdFilters['sortBy']) : undefined
            },
            {
                page: Number(page),
                limit: Number(limit)
            },
            {
                trackListingTypeCompatMetrics: true
            }
        );

        sendSuccessResponse(res, result);
    } catch (err) {
        logger.error('ADMIN_GET_ADS_ERROR', err);
        sendAdminError(req, res, err);
    }
};

/* ────────────────────────────────────────────── */
/* ADMIN: GET SINGLE AD                           */
/* ────────────────────────────────────────────── */
export const adminGetAdById = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendAdminError(req, res, 'Invalid Ad ID', 400);
        }

        const ad = await getAnyAdById(id);

        if (!ad) {
            return sendAdminError(req, res, 'Ad not found', 404);
        }

        sendSuccessResponse(res, ad);
    } catch (err) {
        logger.error('ADMIN_GET_AD_ERROR', err);
        sendAdminError(req, res, err);
    }
};

/* ────────────────────────────────────────────── */
/* ADMIN: UPDATE AD (SAFE)                        */
/* ────────────────────────────────────────────── */
export const adminUpdateAd = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendAdminError(req, res, 'Invalid Ad ID', 400);
        }

        const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(
            req.body as DuplicateBypassBody
        );
        if (!validateDuplicateBypass(req, res, allowDuplicateBypass, duplicateBypassReason)) return;
        const payload = sanitizeDuplicateBypassPayload((req.body || {}) as Record<string, unknown>);

        const statusValue = payload.status;
        const rejectionReason = payload.rejectionReason;
        const hasStatusChange = typeof statusValue === 'string' && statusValue.trim().length > 0;

        let optionalStatusTransition: { toStatus: string, reason?: string } | undefined = undefined;

        if (hasStatusChange) {
            const status = normalizeAdminAdStatusInput(statusValue.trim());
            if (!isValidAdStatus(status)) {
                return sendAdminError(req, res, 'Invalid status value', 400);
            }
            const currentAd = await Ad.findById(id).select('status').lean<{ status: string } | null>();
            if (!currentAd) {
                return sendAdminError(req, res, 'Ad not found', 404);
            }
            validateTransition('ad', currentAd.status as any, status as any);

            optionalStatusTransition = {
                toStatus: status,
                reason: typeof rejectionReason === 'string' ? rejectionReason : undefined
            };
        }

        const restPayload = { ...payload };
        delete restPayload.status;
        delete restPayload.rejectionReason;

        const adminId = req.user!._id.toString();

        const updatedAd = await updateAdTransactional({
            adId: id,
            patch: restPayload,
            context: {
                actor: 'ADMIN',
                authUserId: adminId,
                sellerId: adminId, // Admin acting as owner for bypass logic
                allowQuotaBypass: true,
                allowDuplicateBypass,
                duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
            },
            optionalStatusTransition
        });

        await logAdminAction(
            req,
            'UPDATE_AD',
            'Ad',
            id,
            {
                ...restPayload,
                ...(hasStatusChange ? { status: optionalStatusTransition!.toStatus } : {}),
                allowDuplicateBypass,
                duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
            }
        );

        // Explicitly log the bypass for governance
        await logAdminAction(
            req,
            'SLOT_QUOTA_BYPASS',
            'Ad',
            id,
            {
                via: 'adminUpdateAd',
                reason: 'Admin quota bypass — admin actor',
                adminId,
                allowDuplicateBypass,
                duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
            }
        );

        sendSuccessResponse(res, updatedAd, 'Ad updated successfully');
    } catch (err: unknown) {
        logger.error('ADMIN_UPDATE_AD_ERROR', err);
        sendAdminError(req, res, err);
    }
};

/* ────────────────────────────────────────────── */
/* ADMIN: CHANGE AD STATUS                        */
/* ────────────────────────────────────────────── */
export const adminChangeAdStatus = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const requestedStatus = typeof req.body?.status === 'string' ? req.body.status : '';
        const { rejectionReason } = req.body;
        const status = normalizeAdminAdStatusInput(requestedStatus);

        if (!isValidAdStatus(status)) {
            return sendAdminError(req, res, 'Invalid status value', 400);
        }
        const currentAd = await Ad.findById(id).select('status listingType').lean<{ status: string, listingType?: string } | null>();
        if (!currentAd) {
            return sendAdminError(req, res, 'Ad not found', 404);
        }
        validateTransition('ad', currentAd.status as any, status as any);

        const ad = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: status,
            actor: { type: ACTOR_TYPE.ADMIN, id: req.user!._id.toString() },
            reason: rejectionReason,
            metadata: status === AD_STATUS.LIVE
                ? {
                    action: 'moderation_approve',
                    sourceRoute: '/api/v1/admin/ads/:id/status',
                    listingType: (currentAd as any).listingType || 'ad'
                }
                : {
                    action: 'moderation_status_change',
                    sourceRoute: '/api/v1/admin/ads/:id/status'
                },
            patch: {
                rejectionReason,
                moderatorId: req.user!._id.toString(),
                ...(status === AD_STATUS.LIVE ? {
                    approvedAt: new Date(),
                    approvedBy: req.user!._id.toString(),
                    expiresAt: computeActiveExpiry((currentAd as any).listingType || 'ad')
                } : {})
            }
        });

        await logAdminAction(
            req,
            'CHANGE_AD_STATUS',
            'Ad',
            id,
            { status, rejectionReason }
        );

        sendSuccessResponse(res, ad, 'Status updated successfully');
    } catch (err: unknown) {
        logger.error('ADMIN_CHANGE_STATUS_ERROR', err);
        sendAdminError(req, res, err);
    }
};


/* ────────────────────────────────────────────── */
/* ADMIN: DELETE / SOFT DELETE AD                 */
/* ────────────────────────────────────────────── */
export const adminDeleteAd = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const hardDeleteRequested = req.body?.hardDelete === true;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendAdminError(req, res, 'Invalid Ad ID', 400);
        }

        if (hardDeleteRequested) {
            return sendAdminError(req, res, 'Hard delete is forbidden. Use soft delete only.', 403);
        }

        const deleted = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.DEACTIVATED,
            actor: { type: ACTOR_TYPE.ADMIN, id: req.user!._id.toString() },
            reason: 'Soft deleted by admin',
            metadata: {
                action: 'moderation_soft_delete',
                sourceRoute: '/api/v1/admin/ads/:id',
            },
            patch: {
                isDeleted: true,
                deletedAt: new Date(),
                isSpotlight: false,
                isChatLocked: true,
            },
        });

        if (!deleted) {
            return sendAdminError(req, res, 'Ad not found', 404);
        }

        await logAdminAction(
            req,
            'SOFT_DELETE_AD',
            'Ad',
            id,
            { isDeleted: true }
        );

        sendSuccessResponse(res, { deleted: true }, 'Ad deleted successfully');
    } catch (err) {
        logger.error('ADMIN_DELETE_AD_ERROR', err);
        sendAdminError(req, res, err);
    }
};

/* ────────────────────────────────────────────── */
/* ADMIN: RESTORE SOFT-DELETED AD                 */
/* ────────────────────────────────────────────── */
export const adminRestoreAd = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendAdminError(req, res, 'Invalid Ad ID', 400);
        }

        const restored = await adStatusService.restoreAd(id, req.user!._id.toString(), 'admin');

        if (!restored) {
            return sendAdminError(req, res, 'Ad not found or not deleted', 404);
        }

        await logAdminAction(
            req,
            'RESTORE_AD',
            'Ad',
            id,
            {}
        );

        sendSuccessResponse(res, restored, 'Ad restored successfully');
    } catch (err) {
        logger.error('ADMIN_RESTORE_AD_ERROR', err);
        sendAdminError(req, res, err);
    }
};

/* ────────────────────────────────────────────── */
/* ADMIN: REPORTED ADS (STUBS)                    */
/* ────────────────────────────────────────────── */
/* ────────────────────────────────────────────── */
/* ADMIN: REPORTED ADS                            */
/* ────────────────────────────────────────────── */
export const getReportedAds = async (req: Request, res: Response) => {
    try {
        const { status, reason, search } = req.query;
        const { page, limit, skip } = getPaginationParams(req);

        const { data, total } = await getReportedAdsAggregation(
            {
                status: typeof status === 'string' ? status : undefined,
                reason: typeof reason === 'string' ? reason : undefined,
                search: typeof search === 'string' ? search : undefined
            },
            { skip, limit }
        );

        sendPaginatedResponse(res, data, total, page, limit);
    } catch (err) {
        logger.error('GET_REPORTED_ADS_ERROR', err);
        sendAdminError(req, res, err);
    }
};

export const getReportedAdById = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id) return;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendAdminError(req, res, 'Invalid Report ID', 400);
        }

        const report = await Report.findById(id)
            .populate('adId')
            .populate('reportedBy', 'firstName lastName email')
            .populate('resolvedBy', 'firstName lastName');

        if (!report) return sendAdminError(req, res, 'Report not found', 404);

        sendSuccessResponse(res, report);
    } catch (err) {
        sendAdminError(req, res, err);
    }
};

export const resolveReport = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id) return;
        const { action, note } = req.body;

        const report = await Report.findById(id);
        if (!report) return sendAdminError(req, res, 'Report not found', 404);

        if (action === 'take_down') {
            if (!report.adId) {
                return sendAdminError(req, res, 'Cannot take down: report has no legacy adId', 400);
            }
            await mutateStatus({
                domain: 'ad',
                entityId: report.adId.toString(),
                toStatus: AD_STATUS.REJECTED,
                actor: { type: ACTOR_TYPE.ADMIN, id: req.user!._id.toString() },
                reason: `Taken down via report: ${report.reason}. ${note || ''}`,
                patch: {
                    rejectionReason: `Taken down via report: ${report.reason}. ${note || ''}`
                }
            });
            report.status = REPORT_STATUS.RESOLVED;
        } else if (action === 'dismiss') {
            report.status = REPORT_STATUS.DISMISSED;
        } else if (action === 'warn_user') {
            // Logic for warning could be a notification or flag
            report.status = REPORT_STATUS.REVIEWED;
        }

        report.resolution = note;
        report.resolvedBy = new mongoose.Types.ObjectId(req.user!._id as string);
        report.resolvedAt = new Date();
        await report.save();

        await logAdminAction(req, 'RESOLVE_REPORT', 'Report', id, { action, note });
        sendSuccessResponse(res, report, 'Report resolved successfully');
    } catch (err) {
        sendAdminError(req, res, err);
    }
};

export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id) return;

        const status = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';
        const note = typeof req.body?.note === 'string' ? req.body.note.trim() : undefined;

        if (![REPORT_STATUS.RESOLVED, REPORT_STATUS.DISMISSED].includes(status as any)) {
            return sendAdminError(req, res, `Invalid report status. Allowed: ${REPORT_STATUS.RESOLVED}, ${REPORT_STATUS.DISMISSED}`, 400);
        }

        const report = await Report.findByIdAndUpdate(
            id,
            {
                status,
                resolution: note,
                resolvedBy: new mongoose.Types.ObjectId(req.user!._id as string),
                resolvedAt: new Date()
            },
            { new: true }
        );
        if (!report) return sendAdminError(req, res, 'Report not found', 404);

        await logAdminAction(req, 'UPDATE_REPORT_STATUS', 'Report', id, { status, note });
        sendSuccessResponse(res, report, 'Report status updated successfully');
    } catch (err: unknown) {
        sendAdminError(req, res, err);
    }
};

/* ────────────────────────────────────────────── */
/* ADMIN: QUEUE & STATS                           */
/* ────────────────────────────────────────────── */
export const extendAdExpiration = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const { days = 30 } = req.body;

        const ad = await extendAdExpiry(id, Number(days), req.user!._id.toString(), 'admin');
        if (!ad) return sendAdminError(req, res, 'Ad not found', 404);

        await logAdminAction(req, 'EXTEND_AD_EXPIRY', 'Ad', id, { days });
        sendSuccessResponse(res, ad, `Extended by ${days} days`);
    } catch (err) {
        sendAdminError(req, res, err);
    }
};


export const adminPromoteAd = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const { days = 7, type = 'spotlight_hp' } = req.body;

        const adminUser = req.user as { _id?: string | { toString: () => string } } | undefined;
        const adminId =
            typeof adminUser?._id === 'string'
                ? adminUser._id
                : adminUser?._id?.toString() || 'admin';
        const ad = await promoteAd(id, days, type, adminId, true);
        if (!ad) return sendAdminError(req, res, 'Ad not found', 404);

        await logAdminAction(req, 'PROMOTE_AD', 'Ad', id, { days });
        sendSuccessResponse(res, ad, `Ad promoted for ${days} days`);
    } catch (err) {
        sendAdminError(req, res, err);
    }
};

export const getAdReviewQueue = async (req: Request, res: Response) => {
    try {
        const { page, limit } = getPaginationParams(req);

        const { data, total } = await getAdsByStatus(AD_STATUS.PENDING, { page, limit });

        sendPaginatedResponse(res, data, total, page, limit);
    } catch (err) {
        sendAdminError(req, res, err);
    }
};

export const getAdModerationSummary = async (req: Request, res: Response) => {
    try {
        const summary = await computeModerationSummaryByType();
        sendSuccessResponse(res, summary, 'Ad moderation summary retrieved');
    } catch (err) {
        logger.error('ADMIN_GET_AD_SUMMARY_ERROR', err);
        sendAdminError(req, res, err);
    }
};

/* ────────────────────────────────────────────── */
/* ADMIN-CREATED AD WRAPPER                           */
/* ─────────────────────────────────────────────── */
export const createPostAd = async (req: Request, res: Response) => {
    try {
        const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(
            req.body as DuplicateBypassBody
        );
        if (!validateDuplicateBypass(req, res, allowDuplicateBypass, duplicateBypassReason)) return;
        const payload = sanitizeDuplicateBypassPayload((req.body || {}) as Record<string, unknown>);
        const adminId = req.user!._id.toString();
        const ad = await createAd(payload, {
            actor: 'ADMIN',
            authUserId: adminId,
            sellerId: adminId,
            allowQuotaBypass: true,
        });
        if (!ad) {
            throw new AppError('Failed to create ad', 500, 'AD_CREATE_FAILED');
        }
        const createdAdId = ((ad as unknown as { _id?: unknown })._id ?? '').toString();
        if (!createdAdId) {
            throw new AppError('Created ad id is missing', 500, 'AD_CREATE_FAILED');
        }

        await logAdminAction(req, 'CREATE_AD', 'Ad', createdAdId, {
            ...payload,
            allowDuplicateBypass,
            duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
        });

        // Explicitly log the bypass for governance (hardcoded true for ADMIN)
        await logAdminAction(
            req,
            'SLOT_QUOTA_BYPASS',
            'Ad',
            createdAdId,
            {
                via: 'createPostAd',
                reason: 'Admin quota bypass — admin actor',
                adminId,
                allowDuplicateBypass,
                duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
            }
        );

        if ((ad as { status?: string }).status === AD_STATUS.LIVE) {
            try {
                await Promise.all([
                    invalidateAdFeedCaches(),
                    invalidatePublicAdCache(createdAdId)
                ]);
            } catch (error: unknown) {
                logger.error('Failed to clear feed caches after admin create', {
                    error: error instanceof Error ? error.message : String(error),
                    adId: createdAdId
                });
            }
        }

        sendSuccessResponse(res, ad, 'Ad created successfully', 201);
    } catch (err: unknown) {
        logger.error('ADMIN_CREATE_AD_ERROR', err);
        sendAdminError(req, res, err);
    }
};

export const approveAd = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const { reviewVersion } = req.body;

        const currentAd = await Ad.findById(id).select('status reviewVersion listingType').lean<{ status: string, reviewVersion?: number, listingType?: string } | null>();
        if (!currentAd) return sendAdminError(req, res, 'Ad not found', 404);

        if (typeof reviewVersion === 'number') {
            if (currentAd.reviewVersion !== reviewVersion) {
                return sendAdminError(req, res, 'Conflict: The ad has been edited by the user since your review began.', 409);
            }
        }

        const approvedAt = new Date();
        const ad = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.LIVE,
            actor: { type: ACTOR_TYPE.ADMIN, id: req.user!._id.toString() },
            reason: 'Approved by admin',
            metadata: {
                action: 'moderation_approve',
                sourceRoute: '/api/v1/admin/ads/:id/approve',
                listingType: (currentAd as any).listingType || 'ad',
            },
            patch: {
                moderatorId: req.user!._id.toString(),
                approvedAt,
                approvedBy: req.user!._id.toString(),
                expiresAt: computeActiveExpiry((currentAd as any).listingType || 'ad')
            }
        });

        await logAdminAction(req, 'APPROVE_AD', 'Ad', id, { status: AD_STATUS.LIVE });

        sendSuccessResponse(res, ad, 'Ad approved successfully');
    } catch (err: unknown) {
        logger.error('ADMIN_APPROVE_AD_ERROR', err);
        sendAdminError(req, res, err);
    }
};

export const rejectAd = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Ad ID' });
        if (!id) return;
        const { rejectionReason } = req.body || {};
        if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
            return sendAdminError(req, res, 'Rejection reason is required and cannot be empty', 400);
        }
        const ad = await mutateStatus({
            domain: 'ad',
            entityId: id,
            toStatus: AD_STATUS.REJECTED,
            actor: { type: ACTOR_TYPE.ADMIN, id: req.user!._id.toString() },
            reason: rejectionReason,
            patch: {
                rejectionReason,
                moderatorId: req.user!._id.toString()
            }
        });
        await logAdminAction(req, 'REJECT_AD', 'Ad', id, { status: 'rejected', rejectionReason });
        sendSuccessResponse(res, ad, 'Ad rejected successfully');
    } catch (err: unknown) {
        logger.error('ADMIN_REJECT_AD_ERROR', err);
        sendAdminError(req, res, err);
    }
};
