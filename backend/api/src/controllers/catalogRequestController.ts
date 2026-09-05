import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { escapeRegExp } from '@esparex/core/utils/stringUtils';
import { type ICatalogRequest } from '@esparex/core/models/CatalogRequest';
import * as CatalogRequestService from '@esparex/core/domains/catalog/application/services/CatalogRequestService';
import { sendPaginatedResponse, sendSuccessResponse } from '../utils/respond';
import { sendErrorResponse } from '../utils/errorResponse';
import { logAdminAction } from '../utils/adminLogger';
import { AppError } from '@esparex/core/utils/AppError';
import {
    approveCatalogRequest,
    markCatalogRequestDuplicate,
    rejectCatalogRequest,
} from '@esparex/core/domains/catalog/application/requests/catalogRequestApprovalService';

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

export const getAdminCatalogRequests = async (req: Request, res: Response) => {
    try {
        const query = req.query as {
            status?: 'all' | 'pending' | 'approved' | 'rejected' | 'duplicate' | 'resolved';
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
            if (query.status === 'resolved') {
                filter.status = { $in: ['resolved', 'approved', 'rejected', 'merged'] };
            } else if (query.status === 'duplicate') {
                filter.status = { $in: ['duplicate', 'merged'] };
            } else {
                filter.status = query.status;
            }
        }

        if (query.requestType) {
            filter.requestType = query.requestType;
        }

        if (query.q) {
            const safeSearch = escapeRegExp(query.q);
            filter.$or = [
                { requestedName: { $regex: safeSearch, $options: 'i' } },
                { canonicalName: { $regex: safeSearch, $options: 'i' } },
                { normalizedName: { $regex: safeSearch, $options: 'i' } },
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
        const body = req.body as { duplicateOfEntityId?: string; mergedIntoEntityId?: string; adminNotes?: string };
        const targetEntityId = body.duplicateOfEntityId ?? body.mergedIntoEntityId;

        if (!targetEntityId) {
            throw new AppError('duplicateOfEntityId or mergedIntoEntityId is required', 400, 'DUPLICATE_TARGET_REQUIRED');
        }

        const result = await markCatalogRequestDuplicate({
            requestId: getParamId(req),
            adminId,
            duplicateOfEntityId: targetEntityId,
            adminNotes: body.adminNotes,
        });

        return sendSuccessResponse(res, {
            request: result.request,
            mergedIntoEntityId: result.resolvedEntityId,
            duplicateOfEntityId: result.resolvedEntityId,
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
            resolved: 0,
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

        type StatusKey = 'pending' | 'approved' | 'rejected' | 'duplicate' | 'resolved';
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

const processBulkCatalogAction = async <T extends { request: ICatalogRequest; resolvedEntityId?: unknown }>(
    requestIds: string[],
    actionFn: (id: string) => Promise<T>
) => {
    const results = [];
    for (const requestId of requestIds) {
        try {
            await actionFn(requestId);
            results.push({ id: requestId, status: 'success' });
        } catch (err) {
            results.push({ id: requestId, status: 'error', message: err instanceof Error ? err.message : String(err) });
        }
    }
    return results;
};

export const bulkApproveCatalogRequestsByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const { requestIds } = req.body as { requestIds: string[] };
        
        const results = await processBulkCatalogAction(
            requestIds,
            (requestId) => approveCatalogRequest({ requestId, adminId })
        );

        return sendSuccessResponse(res, { results }, `Processed ${requestIds.length} catalog requests`);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const bulkRejectCatalogRequestsByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const { requestIds, reason } = req.body as { requestIds: string[]; reason: string };
        
        const results = await processBulkCatalogAction(
            requestIds,
            (requestId) => rejectCatalogRequest({ requestId, adminId, rejectionReason: reason })
        );

        return sendSuccessResponse(res, { results }, `Processed ${requestIds.length} catalog requests`);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const bulkMarkCatalogRequestsMergedByAdmin = async (req: Request, res: Response) => {
    try {
        const adminId = getAdminActorId(req);
        const { requestIds, mergedIntoEntityId, duplicateOfId } = req.body as {
            requestIds: string[];
            mergedIntoEntityId?: string;
            duplicateOfId?: string;
        };
        const targetEntityId = duplicateOfId ?? mergedIntoEntityId;

        if (!targetEntityId) {
            throw new AppError('duplicateOfId or mergedIntoEntityId is required', 400, 'DUPLICATE_TARGET_REQUIRED');
        }
        
        const results = await processBulkCatalogAction(
            requestIds,
            (requestId) => markCatalogRequestDuplicate({ requestId, adminId, duplicateOfEntityId: targetEntityId })
        );

        return sendSuccessResponse(res, { results }, `Processed ${requestIds.length} catalog requests`);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const deleteCatalogRequestByAdmin = async (req: Request, res: Response) => {
    try {
        const id = getParamId(req);
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendErrorResponse(req, res, 400, 'Invalid catalog request ID');
        }

        const request = await CatalogRequestService.deleteCatalogRequestById(id);
        if (!request) {
            return sendErrorResponse(req, res, 404, 'Catalog request not found');
        }

        await logAdminAction(req, 'DELETE_CATALOG_REQUEST', 'CatalogRequest', id, {
            requestedName: request.requestedName,
            requestType: request.requestType,
        });

        return sendSuccessResponse(res, { id }, 'Catalog request deleted successfully');
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};

export const bulkDeleteCatalogRequestsByAdmin = async (req: Request, res: Response) => {
    try {
        const { requestIds } = req.body as { requestIds: string[] };

        const { deletedCount } = await CatalogRequestService.bulkDeleteCatalogRequests(requestIds);

        await logAdminAction(req, 'BULK_DELETE_CATALOG_REQUESTS', 'CatalogRequest', 'bulk', {
            deletedCount,
            requestIds,
        });

        return sendSuccessResponse(res, { deletedCount }, `Deleted ${deletedCount} catalog requests`);
    } catch (error) {
        return sendControllerError(req, res, error);
    }
};
