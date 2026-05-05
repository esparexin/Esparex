import { Request, Response } from 'express';
import { sendSuccessResponse, sendAdminError, getPaginationParams, sendPaginatedResponse } from '@esparex/core/utils/adminBaseController';
import { getActorId, buildLogFn } from '@esparex/core/utils/adminLogHelpers';
import { serializeBusinessForAdmin } from './business/shared';
import * as adminBusinessService from '@esparex/core/services/AdminBusinessService';
import { normalizeBusinessStatus } from '@esparex/core/utils/businessStatus';
import { BUSINESS_STATUS } from "@esparex/shared";
import { logAdminActionDirect } from '@esparex/core/utils/adminLogger';
import type { AdminLogFn } from '@esparex/core/services/AdminListingsService';
import type { IAuthUser } from '@esparex/core/types/auth';

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
        const search = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;

        const { adminQuery } = await adminBusinessService.getAdminBusinessAccountsData({
            status,
            locationId,
            search,
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
