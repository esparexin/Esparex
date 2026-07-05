import { approveCatalogRequest, markCatalogRequestDuplicate, rejectCatalogRequest, NotificationDispatcher, CatalogNotificationService, validateBrandBelongsToCategory, validateCategoryIsActive } from '@esparex/core/services';
import { CatalogRequestService_NS as CatalogRequestService } from '@esparex/core/services';

import type { Request, Response } from 'express';
import slugify from 'slugify';
import { type ICatalogRequest } from '@esparex/core/models/CatalogRequest';

import { sendPaginatedResponse, sendSuccessResponse } from '@esparex/core/utils/respond';
import { sendErrorResponse } from '@esparex/core/utils/errorResponse';
import { AppError } from '@esparex/core/utils/AppError';

import { NotificationIntent } from '@esparex/core/domain/NotificationIntent';

import { NOTIFICATION_TYPE } from '@esparex/shared';

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
    status: 'approved' | 'rejected' | 'duplicate' | 'merged',
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

    if (status === 'duplicate' || status === 'merged') {
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

/**
 * Notify ALL users who submitted this suggestion (requestedByUsers[]).
 * Falls back to requestedBy if the array is empty.
 */
const notifyRequesterReviewOutcome = async (
    request: ICatalogRequest,
    status: 'approved' | 'rejected' | 'merged',
    details?: Record<string, unknown>
): Promise<void> => {
    try {
        const message = buildStatusUpdateMessage(request, status as 'approved' | 'rejected' | 'duplicate', details);

        const userIds: string[] = Array.isArray(request.requestedByUsers) && request.requestedByUsers.length > 0
            ? request.requestedByUsers.map(id => String(id))
            : [String(request.requestedBy)];

        // Deduplicate in case requestedBy appears twice
        const uniqueIds = Array.from(new Set(userIds));

        await Promise.allSettled(
            uniqueIds.map(userId =>
                NotificationDispatcher.dispatch(
                    new NotificationIntent({
                        userId,
                        type: NOTIFICATION_TYPE.SYSTEM,
                        entityRef: {
                            domain: 'catalog_request',
                            id: String(request._id),
                        },
                        message,
                        priority: 'medium',
                        channels: ['in-app'],
                    })
                )
            )
        );
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
            listingId?: string;
        };

        const requestedName = payload.requestedName.trim();
        const canonicalName = normalizeCatalogCanonicalName(requestedName);
        const slug = slugify(requestedName, { lower: true, strict: true, trim: true }) || `catalog-request-${Date.now()}`;

        const categoryValidation = await validateCategoryIsActive(payload.categoryId);
        if (!categoryValidation.ok) {
            throw new AppError(
                categoryValidation.reason || 'categoryId must reference an active category.',
                400,
                'CATALOG_REQUEST_CATEGORY_INVALID'
            );
        }

        if (payload.requestType === 'model') {
            const parentBrandId = payload.parentBrandId ?? '';
            const parentBrandValidation = await validateBrandBelongsToCategory(parentBrandId, payload.categoryId);
            if (!parentBrandValidation.ok) {
                throw new AppError(
                    parentBrandValidation.reason || 'parentBrandId must reference an active brand in the selected category.',
                    400,
                    'CATALOG_REQUEST_PARENT_BRAND_INVALID'
                );
            }
        }

        const { request: createdRequest, isNew } = await CatalogRequestService.findOrCreateCatalogRequest({
            requestType: payload.requestType,
            categoryId: payload.categoryId,
            parentBrandId: payload.parentBrandId,
            requestedName,
            canonicalName,
            slug,
            requestedBy,
            listingId: payload.listingId,
        });

        if (!isNew) {
            return sendSuccessResponse(res, createdRequest, 'Existing pending catalog request found');
        }

        const createdRequestId = String((createdRequest as ICatalogRequest)._id);
        void CatalogNotificationService.notifyAdminsOfSuggestion(payload.requestType, requestedName, requestedBy, createdRequestId);

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

        const page = Math.min(1000, Math.max(1, Number(query.page ?? 1)));
        const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
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
                { canonicalName: { $regex: query.q, $options: 'i' } },
                { normalizedName: { $regex: query.q, $options: 'i' } },
            ];
        }

        const { items, total } = await CatalogRequestService.getCatalogRequests(filter, skip, limit, false);

        return sendPaginatedResponse(res, items, total, page, limit);
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

        const page = Math.min(1000, Math.max(1, Number(query.page ?? 1)));
        const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
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
                { canonicalName: { $regex: query.q, $options: 'i' } },
                { normalizedName: { $regex: query.q, $options: 'i' } },
            ];
        }

        const { items, total } = await CatalogRequestService.getCatalogRequests(filter, skip, limit, true);

        return sendPaginatedResponse(res, items, total, page, limit);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const getAdminCatalogRequestById = async (req: Request, res: Response) => {
    try {
        const request = await CatalogRequestService.getCatalogRequestById(getParamId(req), true);

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
        });

        return sendSuccessResponse(res, {
            request: result.request,
            approvedEntityId: result.resolvedEntityId,
            createdCanonicalEntity: result.createdCanonicalEntity,
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

export const markCatalogRequestMergedByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const body = req.body as { mergedIntoEntityId: string; adminNotes?: string };

        const result = await markCatalogRequestDuplicate({
            requestId: getParamId(req),
            adminId,
            duplicateOfEntityId: body.mergedIntoEntityId,
            adminNotes: body.adminNotes,
        });

        void notifyRequesterReviewOutcome(result.request, 'merged', {
            mergedIntoEntityId: String(result.resolvedEntityId),
        });

        return sendSuccessResponse(res, {
            request: result.request,
            mergedIntoEntityId: result.resolvedEntityId,
        }, 'Catalog request merged into existing entity successfully');
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

        const { groupedCounts, totalCount } = await CatalogRequestService.getCatalogRequestStats(match);

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

        type StatusKey = 'pending' | 'approved' | 'rejected' | 'duplicate';
        type RequestTypeKey = 'brand' | 'model';
        
        groupedCounts.forEach((row: { _id: { requestType: RequestTypeKey, status: StatusKey }, count: number }) => {
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

export const bulkApproveCatalogRequestsByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const { requestIds } = req.body as { requestIds: string[] };
        const results = [];

        for (const requestId of requestIds) {
            try {
                const result = await approveCatalogRequest({ requestId, adminId });
                void notifyRequesterReviewOutcome(result.request, 'approved', {
                    approvedEntityId: String(result.resolvedEntityId),
                });
                results.push({ id: requestId, status: 'success' });
            } catch (err) {
                results.push({ id: requestId, status: 'error', message: err instanceof Error ? err.message : String(err) });
            }
        }

        return sendSuccessResponse(res, { results }, `Processed ${requestIds.length} catalog requests`);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const bulkRejectCatalogRequestsByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const { requestIds, reason } = req.body as { requestIds: string[]; reason: string };
        const results = [];

        for (const requestId of requestIds) {
            try {
                const result = await rejectCatalogRequest({ requestId, adminId, rejectionReason: reason });
                void notifyRequesterReviewOutcome(result.request, 'rejected', {
                    rejectionReason: result.request.rejectionReason,
                });
                results.push({ id: requestId, status: 'success' });
            } catch (err) {
                results.push({ id: requestId, status: 'error', message: err instanceof Error ? err.message : String(err) });
            }
        }

        return sendSuccessResponse(res, { results }, `Processed ${requestIds.length} catalog requests`);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const bulkMarkCatalogRequestsMergedByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const { requestIds, mergedIntoEntityId } = req.body as { requestIds: string[]; mergedIntoEntityId: string };
        const results = [];

        for (const requestId of requestIds) {
            try {
                const result = await markCatalogRequestDuplicate({ requestId, adminId, duplicateOfEntityId: mergedIntoEntityId });
                void notifyRequesterReviewOutcome(result.request, 'merged', {
                    mergedIntoEntityId: String(result.resolvedEntityId),
                });
                results.push({ id: requestId, status: 'success' });
            } catch (err) {
                results.push({ id: requestId, status: 'error', message: err instanceof Error ? err.message : String(err) });
            }
        }

        return sendSuccessResponse(res, { results }, `Processed ${requestIds.length} catalog requests`);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};
