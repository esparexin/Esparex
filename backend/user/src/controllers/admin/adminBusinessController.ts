import { AdminBusinessService_NS as adminBusinessService } from '@esparex/core/services';

﻿import { Request, Response } from 'express';
import { sendSuccessResponse, sendAdminError, getPaginationParams, sendPaginatedResponse } from '@esparex/core/utils/adminBaseController';
import { serializeBusinessForAdmin } from './business/shared';

import { normalizeBusinessStatus } from '@esparex/core/utils/businessStatus';
import { BUSINESS_STATUS } from "@esparex/shared";
import { logAdminActionDirect } from '@esparex/core/utils/adminLogger';
import type { AdminLogFn } from '@esparex/core/services/AdminListingsService';
import type { IAuthUser } from '@esparex/core/types/auth';

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const getActorId = (req: Request): string =>
    (req.user as IAuthUser)?._id?.toString() ?? (req.user as IAuthUser)?.id ?? '';

const getIp = (req: Request): string =>
    (((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();

const getUserAgent = (req: Request): string =>
    (req.headers['user-agent'] as string) || '';

const buildLogFn = (req: Request): AdminLogFn =>
    (action, targetType, targetId, metadata) =>
        logAdminActionDirect(
            getActorId(req),
            action,
            targetType,
            targetId,
            metadata,
            getIp(req),
            getUserAgent(req)
        );

// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------

export const getBusinessOverview = async (req: Request, res: Response) => {
    try {
        const overview = await adminBusinessService.getBusinessOverview();
        sendSuccessResponse(res, overview);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const getBusinessAccounts = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const locationId = typeof req.query.locationId === 'string' ? req.query.locationId.trim() : undefined;
        const search = typeof (req.query.q || req.query.search) === 'string' ? String(req.query.q || req.query.search).trim() : undefined;
        const expiringIn3Days = typeof req.query.expiringIn3Days === 'string' ? req.query.expiringIn3Days : undefined;
        const warningSent = typeof req.query.warningSent === 'string' ? req.query.warningSent : undefined;
        const warningNotSent = typeof req.query.warningNotSent === 'string' ? req.query.warningNotSent : undefined;

        const { adminQuery } = await adminBusinessService.getAdminBusinessAccountsData({
            status,
            locationId,
            search,
            expiringIn3Days,
            warningSent,
            warningNotSent,
            page,
            limit,
        });

        if (search) {
            const { escapeRegExp } = await import('@esparex/core/utils/stringUtils');
            const safeSearch = escapeRegExp(search);
            (adminQuery).$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { mobile: { $regex: safeSearch, $options: 'i' } },
                { 'location.city': { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const Business = (await import('@esparex/core/models/Business')).default;
        const [rawItems, total] = await Promise.all([
            Business.find(adminQuery)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate('userId')
                .setOptions({ withDeleted: true }),
            Business.countDocuments(adminQuery)
                .setOptions({ withDeleted: true }),
        ]);
        const items = adminBusinessService.transformBusinessDocs(rawItems);
        return sendPaginatedResponse(res, items, total, page, limit);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const getBusinessAccountById = async (req: Request, res: Response) => {
    try {
        const business = await adminBusinessService.getAdminBusinessById(req.params.id as string);
        if (!business) {
            return sendAdminError(req, res, 'Business not found', 404);
        }
        sendSuccessResponse(res, serializeBusinessForAdmin(business));
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const approveBusinessAccount = async (req: Request, res: Response) => {
    try {
        const business = await adminBusinessService.approveAdminBusiness(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business approved successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const rejectBusinessAccount = async (req: Request, res: Response) => {
    try {
        const rejectBody = req.body as { reason?: unknown };
        const reason = typeof rejectBody.reason === 'string' ? rejectBody.reason.trim() : '';
        const business = await adminBusinessService.rejectAdminBusiness(
            req.params.id as string,
            reason,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business rejected');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateBusinessStatus = async (req: Request, res: Response) => {
    try {
        const statusBody = req.body as { status?: unknown; reason?: unknown };
        const rawStatus = typeof statusBody.status === 'string' ? statusBody.status.trim() : '';
        const status = normalizeBusinessStatus(rawStatus);
        const reason = typeof statusBody.reason === 'string' ? statusBody.reason.trim() : '';

        if (status === BUSINESS_STATUS.LIVE) {
            return approveBusinessAccount(req, res);
        }

        if (status === BUSINESS_STATUS.REJECTED) {
            if (!reason) (req.body as Record<string, unknown>).reason = 'Rejected by admin';
            return rejectBusinessAccount(req, res);
        }

        if (status === BUSINESS_STATUS.SUSPENDED) {
            const business = await adminBusinessService.suspendAdminBusiness(
                req.params.id as string,
                reason,
                getActorId(req),
                buildLogFn(req)
            );
            return sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business suspended successfully');
        }

        return sendAdminError(req, res, `Invalid status. Allowed: ${BUSINESS_STATUS.LIVE}, ${BUSINESS_STATUS.REJECTED}, ${BUSINESS_STATUS.SUSPENDED}`, 400);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const updateBusinessByAdmin = async (req: Request, res: Response) => {
    try {
        const business = await adminBusinessService.updateAdminBusinessFields(
            req.params.id as string,
            req.body as Record<string, unknown>,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business updated successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const deleteBusinessAccount = async (req: Request, res: Response) => {
    try {
        await adminBusinessService.deleteAdminBusiness(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, { deleted: true }, 'Business deleted successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const renewBusinessAccount = async (req: Request, res: Response) => {
    try {
        const business = await adminBusinessService.renewAdminBusiness(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business renewed successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const expireBusinessAccount = async (req: Request, res: Response) => {
    try {
        const business = await adminBusinessService.expireAdminBusiness(
            req.params.id as string,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, serializeBusinessForAdmin(business), 'Business marked as expired');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};
export const adminBulkApproveBusinesses = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body as { ids?: string[] };
        if (!Array.isArray(ids) || !ids.length) {
            return sendAdminError(req, res, 'IDs array is required', 400);
        }
        const count = await adminBusinessService.adminBulkApproveBusinesses(
            ids,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, { approvedCount: count }, `${count} businesses approved successfully`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const adminBulkRejectBusinesses = async (req: Request, res: Response) => {
    try {
        const { ids, reason } = req.body as { ids?: string[]; reason?: string };
        if (!Array.isArray(ids) || !ids.length) {
            return sendAdminError(req, res, 'IDs array is required', 400);
        }
        const finalReason = typeof reason === 'string' ? reason.trim() : 'Rejected by admin';
        const count = await adminBusinessService.adminBulkRejectBusinesses(
            ids,
            finalReason,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, { rejectedCount: count }, `${count} businesses rejected`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const adminBulkDeactivateBusinesses = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body as { ids?: string[] };
        if (!Array.isArray(ids) || !ids.length) {
            return sendAdminError(req, res, 'IDs array is required', 400);
        }
        const count = await adminBusinessService.adminBulkDeactivateBusinesses(
            ids,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, { deactivatedCount: count }, `${count} businesses deactivated`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const adminBulkExpireBusinesses = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body as { ids?: string[] };
        if (!Array.isArray(ids) || !ids.length) {
            return sendAdminError(req, res, 'IDs array is required', 400);
        }
        const count = await adminBusinessService.adminBulkExpireBusinesses(
            ids,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, { expiredCount: count }, `${count} businesses marked as expired`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const adminBulkRenewBusinesses = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body as { ids?: string[] };
        if (!Array.isArray(ids) || !ids.length) {
            return sendAdminError(req, res, 'IDs array is required', 400);
        }
        const count = await adminBusinessService.adminBulkRenewBusinesses(
            ids,
            getActorId(req),
            buildLogFn(req)
        );
        sendSuccessResponse(res, { renewedCount: count }, `${count} businesses renewed successfully`);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const adminBulkResendBusinessWarnings = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body as { ids: string[] };
        const result = await adminBusinessService.adminBulkResendBusinessWarnings(
            ids,
            getActorId(req),
            buildLogFn(req)
        );
        return sendSuccessResponse(res, result, 'Bulk re-send business warnings completed');
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};
