/**
 * Shared utilities for catalog controllers
 * Extracted from original catalog.content.controller.ts
 *
 * Validation logic is delegated to CatalogValidationService (SSOT).
 * Re-exports keep existing controller imports stable.
 */

import { Request, Response } from 'express';
import { Document, Model as MongooseModel } from 'mongoose';
import { z } from 'zod';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { respond, sendSuccessResponse } from "../../../utils/respond";
import { sendErrorResponse as sendContractErrorResponse, sendCatalogError } from "../../../utils/errorResponse";
import { isDuplicateKeyError } from '@esparex/core/utils/errorHelpers';

// Re-export SSOT validation helpers so controllers import from one place.
import {
    ACTIVE_CATEGORY_QUERY,
    ACTIVE_BRAND_QUERY,
    CATALOG_PUBLIC_VISIBILITY_QUERY,
    getActiveCategoryIds,
    validateActiveCategories,
    deriveApprovalStatus,
} from '@esparex/core/services/catalog/CatalogValidationService';

import { logAdminAction } from '../../../utils/adminLogger';
import { handlePaginatedContent } from "../../../utils/contentHandler";

export {
    sendCatalogError,
    sendSuccessResponse,
    handlePaginatedContent,
    ACTIVE_CATEGORY_QUERY,
    ACTIVE_BRAND_QUERY,
    CATALOG_PUBLIC_VISIBILITY_QUERY,
    getActiveCategoryIds,
    validateActiveCategories,
    deriveApprovalStatus
};

export type CatalogRequest = Request & {
    user?: { role?: string; id?: string; _id?: string | { toString: () => string } };
    admin?: { id?: string; _id?: string | { toString: () => string } };
};

export type QueryRecord = Record<string, unknown>;

const hasSchemaPath = (
    model: { schema: { path(field: string): unknown } },
    path: string
): boolean => Boolean(model.schema.path(path));

export type CatalogStatusFilterToken =
    | 'live'
    | 'active'
    | 'inactive'
    | 'deactivated'
    | 'pending'
    | 'rejected';

export const applyCatalogStatusFilter = (
    targetQuery: QueryRecord,
    rawStatus: unknown
) => {
    if (typeof rawStatus !== 'string') return;
    const status = rawStatus.trim().toLowerCase();
    if (!status || status === 'all') return;

    if (status === 'live') {
        targetQuery.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
        targetQuery.isActive = true;
        return;
    }
    if (status === 'active') {
        targetQuery.isActive = true;
        return;
    }
    if (status === 'inactive' || status === 'deactivated') {
        targetQuery.isActive = false;
        return;
    }
    if (status === 'pending') {
        targetQuery.approvalStatus = CATALOG_APPROVAL_STATUS.PENDING;
        return;
    }
    if (status === 'rejected') {
        targetQuery.approvalStatus = CATALOG_APPROVAL_STATUS.REJECTED;
    }
};

/**
 * Check if request has admin access
 */
export const hasAdminAccess = (req: Request): boolean => {
    const catalogRequest = req as CatalogRequest;
    const role = catalogRequest.user?.role;
    return role === 'admin' || role === 'super_admin';
};

/**
 * Extract admin actor ID from request context
 */
export const getAdminActorId = (req: Request): string | undefined => {
    const catalogRequest = req as CatalogRequest;
    const userId = catalogRequest.user?._id ?? catalogRequest.user?.id;
    if (typeof userId === 'string') return userId;
    if (userId && typeof userId.toString === 'function') return userId.toString();
    const adminEntry = catalogRequest.admin as { _id?: string | { toString(): string }; id?: string } | undefined;
    const adminId = adminEntry?._id ?? adminEntry?.id;
    if (typeof adminId === 'string') return adminId;
    if (adminId && typeof (adminId as { toString?: unknown }).toString === 'function') return (adminId).toString();
    return undefined;
};

// sendCatalogError is imported and re-exported from "../../../utils/errorResponse" (line above)

/**
 * Send Zod validation error response mapping issues to field-level details
 */
export const sendValidationError = (req: Request, res: Response, error: { issues: Array<{ path: Array<string | number>; message: string }> }) => {
    sendContractErrorResponse(req, res, 400, 'Validation failed', {
        details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    });
};

/**
 * Send an empty paginated list response (common for invalid public filters)
 */
export const sendEmptyPublicList = (res: Response) => {
    res.status(200).json(respond({
        success: true,
        data: {
            items: [],
            total: 0
        }
    }));
};

// isDuplicateKeyError imported from errorHelpers (SSOT)
export { isDuplicateKeyError };

/* ======================================================
   GENERIC CATALOG CRUD HANDLERS
====================================================== */

/**
 * GENERIC CREATE
 */
export async function handleCatalogCreate<T extends Document>(
    req: Request,
    res: Response,
    model: MongooseModel<T>,
    schema: z.ZodTypeAny,
    options: {
        auditAction?: string;
        slugifyName?: boolean;
        preOp?: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
        postOp?: (item: T) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        let payload: Record<string, unknown> = req.body as Record<string, unknown>;
        if (options.preOp) {
            payload = await options.preOp(payload);
        }

        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return sendValidationError(req, res, parsed.error);
        }

        const data = parsed.data as Record<string, unknown>;
        if (options.slugifyName && data.name) {
            data.slug = slugify(data.name as string, { lower: true, strict: true }) + '-' + nanoid(6);
        }

        const item = await model.create(data as unknown as Partial<T>);

        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, model.modelName as Parameters<typeof logAdminAction>[2], item._id, { data });
        }

        return sendSuccessResponse(res, item, `${model.modelName} created successfully`);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendContractErrorResponse(req, res, 400, `${model.modelName} already exists`);
        }
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC UPDATE
 */
export async function handleCatalogUpdate<T extends Document>(
    req: Request,
    res: Response,
    model: MongooseModel<T>,
    schema: z.ZodTypeAny,
    options: {
        auditAction?: string;
        slugifyName?: boolean;
        preUpdate?: (id: string, payload: Record<string, unknown>, existing: T) => Promise<Record<string, unknown>>;
        updateOp?: (id: string, data: Record<string, unknown>, existing: T) => Promise<T | unknown>;
        postOp?: (item: T) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const id = String(req.params.id);
        const existing = await model.findById(id);
        if (!existing) {
            return sendContractErrorResponse(req, res, 404, `${model.modelName} not found`);
        }

        let payload: Record<string, unknown> = req.body as Record<string, unknown>;
        if (options.preUpdate) {
            payload = await options.preUpdate(id, payload, existing);
        }

        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return sendValidationError(req, res, parsed.error);
        }

        const data = parsed.data as Record<string, unknown>;
        if (options.slugifyName && data.name) {
            data.slug = slugify(data.name as string, { lower: true, strict: true });
        }

        const item = options.updateOp
            ? await options.updateOp(id, data, existing)
            : await model.findByIdAndUpdate(id, data as unknown as Partial<T>, { new: true });
        
        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            const auditItem = item as { _id?: string | { toString: () => string } } | null;
            void logAdminAction(req, options.auditAction, model.modelName as Parameters<typeof logAdminAction>[2], auditItem?._id, { updates: data });
        }

        return sendSuccessResponse(res, item, `${model.modelName} updated successfully`);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendContractErrorResponse(req, res, 400, `${model.modelName} already exists`);
        }
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC TOGGLE STATUS
 */
export async function handleCatalogToggleStatus<T extends Document>(
    req: Request,
    res: Response,
    model: MongooseModel<T>,
    options: { 
        auditAction?: string;
        postOp?: (item: T) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const item = await model.findById(req.params.id);
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${model.modelName} not found`);
        }

        const isActive = !(item as T & { isActive?: boolean }).isActive;
        const typedItem = item as T & { approvalStatus?: unknown; isActive?: boolean; categoryIds?: string[] };

        if (isActive && hasSchemaPath(model, 'categoryIds') && (!typedItem.categoryIds || typedItem.categoryIds.length === 0)) {
            return sendContractErrorResponse(req, res, 400, 'Cannot activate brand/model with no assigned categories');
        }

        const approvalStatus = deriveApprovalStatus({
            approvalStatus: typedItem.approvalStatus,
            isActive: typedItem.isActive,
            fallback: CATALOG_APPROVAL_STATUS.APPROVED,
        });
        const nextState: Record<string, unknown> = { isActive };
        if (hasSchemaPath(model, 'approvalStatus')) {
            nextState.approvalStatus = approvalStatus;
        }

        await model.findByIdAndUpdate(req.params.id, nextState);
        
        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, model.modelName as Parameters<typeof logAdminAction>[2], item._id, { isActive, approvalStatus });
        }

        return sendSuccessResponse(res, nextState, `${model.modelName} status updated to ${isActive ? 'active' : 'inactive'}`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC DELETE
 */
export async function handleCatalogDelete<T extends Document>(
    req: Request,
    res: Response,
    model: MongooseModel<T>,
    checkDependencies?: (id: string) => Promise<{ count: number; details: unknown }>,
    options: { 
        auditAction?: string;
        postOp?: (item: T) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const id = String(req.params.id);

        if (checkDependencies) {
            const deps = await checkDependencies(id);
            if (deps.count > 0) {
                return sendContractErrorResponse(req, res, 400, `Cannot delete ${model.modelName} with active dependencies`, { details: deps.details });
            }
        }

        const softDeleteUpdate: Record<string, unknown> = {
            isDeleted: true,
            deletedAt: new Date(),
            isActive: false,
        };

        const item = await model.findByIdAndUpdate(id, softDeleteUpdate, { new: true });
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${model.modelName} not found`);
        }

        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, model.modelName as Parameters<typeof logAdminAction>[2], item._id);
        }

        return sendSuccessResponse(res, null, `${model.modelName} deleted successfully`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC REVIEW (APPROVE/REJECT)
 */
export async function handleCatalogReview<T extends Document>(
    req: Request,
    res: Response,
    model: MongooseModel<T>,
    action: 'APPROVE' | 'REJECT',
    schema?: z.ZodTypeAny,
    options: { 
        auditAction?: string;
        postOp?: (item: T) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        let updates: Record<string, unknown> = {};
        if (action === 'APPROVE') {
            updates = {
                approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
                isActive: true
            };
        } else {
            const parsed = schema?.safeParse(req.body);
            if (schema && !parsed?.success) {
                return sendValidationError(req, res, parsed!.error);
            }
            updates = {
                approvalStatus: CATALOG_APPROVAL_STATUS.REJECTED,
                isActive: false,
                rejectionReason: (parsed?.data as { reason?: string } | undefined)?.reason || (req.body as { reason?: string })?.reason
            };
        }


        const item = await model.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${model.modelName} not found`);
        }

        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, model.modelName as Parameters<typeof logAdminAction>[2], item._id, { updates });
        }

        return sendSuccessResponse(res, item, `${model.modelName} ${action.toLowerCase()}d successfully`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}
