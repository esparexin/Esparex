import type { Request, Response } from 'express';
import slugify from 'slugify';
import CatalogRequest, { type ICatalogRequest } from '@esparex/core/models/CatalogRequest';
import { sendSuccessResponse } from '@esparex/core/utils/respond';
import { sendErrorResponse } from '@esparex/core/utils/errorResponse';
import { AppError } from '@esparex/core/utils/AppError';
import {
    approveCatalogRequest,
    markCatalogRequestDuplicate,
    rejectCatalogRequest,
} from '@esparex/core/services/catalogRequestApprovalService';
import { NotificationIntent } from '@esparex/core/domain/NotificationIntent';
import { NotificationDispatcher } from '@esparex/core/services/notification/NotificationDispatcher';
import { NOTIFICATION_TYPE } from '@esparex/core/constants/enums/notificationType';
import { CatalogNotificationService } from '@esparex/core/services/catalog/CatalogNotificationService';

const REQUESTED_BY_PUBLIC_FIELDS = 'firstName lastName email mobile';

const normalizeCatalogCanonicalName = (value: string): string =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

const getUserActorId = (req: Request): string => {
    const actorId = req.user?._id ?? req.user?.id;
    if (!actorId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    return typeof actorId === 'string' ? actorId : actorId.toString();
};

const getAdminActorId = (req: Request): string => {
    const actorId = req.admin?._id ?? req.user?._id ?? req.user?.id;
    if (!actorId) {
        throw new AppError('Unauthorized admin context', 401, 'UNAUTHORIZED_ADMIN');
    }
    return typeof actorId === 'string' ? actorId : actorId.toString();
};

const getParamId = (req: Request, key: string = 'id'): string => {
    const value = req.params?.[key];
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }
    return value ?? '';
};

const sendControllerError = (req: Request, res: Response, error: unknown) => {
    const appError = error instanceof AppError
        ? error
        : new AppError(error instanceof Error ? error.message : 'Catalog request operation failed', 500, 'CATALOG_REQUEST_ERROR');

    return sendErrorResponse(req, res, appError.statusCode, appError.message, {
        ...(appError.code ? { code: appError.code } : {}),
        ...(appError.details !== undefined ? { details: appError.details } : {}),
    });
};

const buildStatusUpdateMessage = (
    request: ICatalogRequest,
    status: 'approved' | 'rejected' | 'duplicate',
    details?: Record<string, unknown>
): { title: string; body: string; data: Record<string, unknown> } => {
    const subject = request.requestType === 'brand' ? 'brand' : 'model';

    if (status === 'approved') {
        return {
            title: 'Catalog request approved',
            body: `Your ${subject} request "${request.requestedName}" has been approved.`,
            data: {
                kind: 'catalog_request_reviewed',
                catalogRequestId: String(request._id),
                requestType: request.requestType,
                status,
                ...details,
            },
        };
    }

    if (status === 'duplicate') {
        return {
            title: 'Catalog request linked to existing entry',
            body: `Your ${subject} request "${request.requestedName}" matched an existing catalog entry.`,
            data: {
                kind: 'catalog_request_reviewed',
                catalogRequestId: String(request._id),
                requestType: request.requestType,
                status,
                ...details,
            },
        };
    }

    return {
        title: 'Catalog request rejected',
        body: `Your ${subject} request "${request.requestedName}" was rejected. Please submit a corrected request.`,
        data: {
            kind: 'catalog_request_reviewed',
            catalogRequestId: String(request._id),
            requestType: request.requestType,
            status,
            ...details,
        },
    };
};

const notifyRequesterReviewOutcome = async (
    request: ICatalogRequest,
    status: 'approved' | 'rejected' | 'duplicate',
    details?: Record<string, unknown>
): Promise<void> => {
    try {
        const message = buildStatusUpdateMessage(request, status, details);
        const intent = new NotificationIntent({
            userId: String(request.requestedBy),
            type: NOTIFICATION_TYPE.SYSTEM,
            entityRef: {
                domain: 'catalog_request',
                id: String(request._id),
            },
            message,
            priority: 'medium',
            channels: ['in-app'],
        });

        await NotificationDispatcher.dispatch(intent);
    } catch {
        // Best effort notification only; review flow should not fail.
    }
};

export const createCatalogRequest = async (req: Request, res: Response) => {
    try {
        const requestedBy = getUserActorId(req);
        const payload = req.body as {
            requestType: 'brand' | 'model';
            categoryId: string;
            parentBrandId?: string;
            requestedName: string;
        };

        const requestedName = payload.requestedName.trim();
        const normalizedName = normalizeCatalogCanonicalName(requestedName);
        const slug = slugify(requestedName, { lower: true, strict: true, trim: true }) || `catalog-request-${Date.now()}`;

        const dedupeQuery = {
            requestType: payload.requestType,
            categoryId: payload.categoryId,
            parentBrandId: payload.requestType === 'model' ? payload.parentBrandId ?? null : null,
            normalizedName,
            requestedBy,
            status: 'pending' as const,
        };

        const existingPending = await CatalogRequest.findOne(dedupeQuery).sort({ createdAt: -1 });
        if (existingPending) {
            return sendSuccessResponse(res, existingPending, 'Existing pending catalog request found');
        }

        const createdRequest = await CatalogRequest.create({
            requestType: payload.requestType,
            categoryId: payload.categoryId,
            parentBrandId: payload.requestType === 'model' ? payload.parentBrandId : null,
            requestedName,
            normalizedName,
            slug,
            requestedBy,
            status: 'pending',
        });

        void CatalogNotificationService.notifyAdminsOfSuggestion(payload.requestType, requestedName, requestedBy, String(createdRequest._id));

        return sendSuccessResponse(res, createdRequest, 'Catalog request submitted successfully', 201);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const getMyCatalogRequests = async (req: Request, res: Response) => {
    try {
        const requestedBy = getUserActorId(req);
        const query = req.query as {
            status?: 'all' | 'pending' | 'approved' | 'rejected' | 'duplicate';
            requestType?: 'brand' | 'model';
            q?: string;
            page?: number;
            limit?: number;
        };

        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 20);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = { requestedBy };

        if (query.status && query.status !== 'all') {
            filter.status = query.status;
        }

        if (query.requestType) {
            filter.requestType = query.requestType;
        }

        if (query.q) {
            filter.$or = [
                { requestedName: { $regex: query.q, $options: 'i' } },
                { normalizedName: { $regex: query.q, $options: 'i' } },
            ];
        }

        const [items, total] = await Promise.all([
            CatalogRequest.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CatalogRequest.countDocuments(filter),
        ]);

        return sendSuccessResponse(res, {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const getAdminCatalogRequests = async (req: Request, res: Response) => {
    try {
        const query = req.query as {
            status?: 'all' | 'pending' | 'approved' | 'rejected' | 'duplicate';
            requestType?: 'brand' | 'model';
            q?: string;
            page?: number;
            limit?: number;
        };

        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 20);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};

        if (query.status && query.status !== 'all') {
            filter.status = query.status;
        }

        if (query.requestType) {
            filter.requestType = query.requestType;
        }

        if (query.q) {
            filter.$or = [
                { requestedName: { $regex: query.q, $options: 'i' } },
                { normalizedName: { $regex: query.q, $options: 'i' } },
            ];
        }

        const [items, total] = await Promise.all([
            CatalogRequest.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('requestedBy', REQUESTED_BY_PUBLIC_FIELDS),
            CatalogRequest.countDocuments(filter),
        ]);

        return sendSuccessResponse(res, {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const getAdminCatalogRequestById = async (req: Request, res: Response) => {
    try {
        const request = await CatalogRequest.findById(getParamId(req))
            .populate('requestedBy', REQUESTED_BY_PUBLIC_FIELDS);

        if (!request) {
            throw new AppError('Catalog request not found.', 404, 'CATALOG_REQUEST_NOT_FOUND');
        }

        return sendSuccessResponse(res, request);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const approveCatalogRequestByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const body = req.body as { adminNotes?: string };

        const result = await approveCatalogRequest({
            requestId: getParamId(req),
            adminId,
            adminNotes: body.adminNotes,
        });

        void notifyRequesterReviewOutcome(result.request, 'approved', {
            approvedEntityId: String(result.resolvedEntityId),
            updatedAdsCount: result.updatedAdsCount,
        });

        return sendSuccessResponse(res, {
            request: result.request,
            approvedEntityId: result.resolvedEntityId,
            createdCanonicalEntity: result.createdCanonicalEntity,
            updatedAdsCount: result.updatedAdsCount,
        }, 'Catalog request approved successfully');
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const rejectCatalogRequestByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const body = req.body as { rejectionReason: string; adminNotes?: string };

        const result = await rejectCatalogRequest({
            requestId: getParamId(req),
            adminId,
            rejectionReason: body.rejectionReason,
            adminNotes: body.adminNotes,
        });

        void notifyRequesterReviewOutcome(result.request, 'rejected', {
            rejectionReason: result.request.rejectionReason,
        });

        return sendSuccessResponse(res, {
            request: result.request,
        }, 'Catalog request rejected successfully');
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const markCatalogRequestDuplicateByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const body = req.body as { duplicateOfEntityId: string; adminNotes?: string };

        const result = await markCatalogRequestDuplicate({
            requestId: getParamId(req),
            adminId,
            duplicateOfEntityId: body.duplicateOfEntityId,
            adminNotes: body.adminNotes,
        });

        void notifyRequesterReviewOutcome(result.request, 'duplicate', {
            duplicateOfEntityId: String(result.resolvedEntityId),
            updatedAdsCount: result.updatedAdsCount,
        });

        return sendSuccessResponse(res, {
            request: result.request,
            duplicateOfEntityId: result.resolvedEntityId,
            updatedAdsCount: result.updatedAdsCount,
        }, 'Catalog request marked as duplicate successfully');
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const getAdminCatalogRequestStats = async (req: Request, res: Response) => {
    try {
        const query = req.query as { requestType?: 'brand' | 'model' };
        const match: Record<string, unknown> = {};

        if (query.requestType) {
            match.requestType = query.requestType;
        }

        const [groupedCounts, totalCount] = await Promise.all([
            CatalogRequest.aggregate<{
                _id: { requestType: 'brand' | 'model'; status: 'pending' | 'approved' | 'rejected' | 'duplicate' };
                count: number;
            }>([
                { $match: match },
                {
                    $group: {
                        _id: {
                            requestType: '$requestType',
                            status: '$status',
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            CatalogRequest.countDocuments(match),
        ]);

        const emptyBuckets = {
            pending: 0,
            approved: 0,
            rejected: 0,
            duplicate: 0,
            total: 0,
        };

        const stats = {
            total: totalCount,
            byStatus: { ...emptyBuckets },
            byRequestType: {
                brand: { ...emptyBuckets },
                model: { ...emptyBuckets },
            },
        };

        groupedCounts.forEach((row) => {
            const requestType = row._id.requestType;
            const status = row._id.status;

            stats.byStatus[status] += row.count;
            stats.byStatus.total += row.count;
            stats.byRequestType[requestType][status] += row.count;
            stats.byRequestType[requestType].total += row.count;
        });

        return sendSuccessResponse(res, stats);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};
