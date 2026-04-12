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
import Category from '../../models/Category';
import { respond } from '../../utils/respond';
import { sendErrorResponse as sendContractErrorResponse, sendCatalogError } from '../../utils/errorResponse';
import { 
    sendSuccessResponse,
    sendAdminError
} from '../admin/adminBaseController';
import { CatalogStatusValue, CATALOG_STATUS } from '@shared/enums/catalogStatus';

// Re-export SSOT validation helpers so controllers import from one place.
import {
    ACTIVE_CATEGORY_QUERY,
    ACTIVE_BRAND_QUERY,
    getActiveCategoryIds,
    validateActiveCategories,
} from '../../services/catalog/CatalogValidationService';

import { logAdminAction } from '../../utils/adminLogger';
import { handlePaginatedContent } from '../../utils/contentHandler';

export type { CatalogStatusValue };
export { 
    sendAdminError,
    sendSuccessResponse,
    sendCatalogError,
    CATALOG_STATUS,
    ACTIVE_CATEGORY_QUERY,
    ACTIVE_BRAND_QUERY,
    getActiveCategoryIds,
    validateActiveCategories,
    handlePaginatedContent
};

export type CatalogRequest = Request & {
    user?: { role?: string; id?: string; _id?: string | { toString: () => string } };
    admin?: { id?: string; _id?: string | { toString: () => string } };
};

export type QueryRecord = Record<string, unknown>;

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
    const adminId = catalogRequest.admin?._id ?? catalogRequest.admin?.id;
    if (typeof adminId === 'string') return adminId;
    if (adminId && typeof adminId.toString === 'function') return adminId.toString();
    return undefined;
};

/**
 * Type-safe model wrapper
 */
export const asModel = <T extends Document>(model: MongooseModel<T>): MongooseModel<T> => model;

/** Backwards-compat helper — prefer CatalogValidationService.validateCategoryIsActive */
export const isCategoryActive = async (categoryId: string): Promise<boolean> => {
    const exists = await Category.exists({ _id: categoryId, ...ACTIVE_CATEGORY_QUERY });
    return Boolean(exists);
};

// sendCatalogError is imported and re-exported from '../../utils/errorResponse' (line 16)

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

/**
 * Check if a mongo error is a duplicate key error
 */
export const isDuplicateKeyError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { code?: unknown; message?: unknown };
    return candidate.code === 11000 || (typeof candidate.message === 'string' && candidate.message.includes('E11000'));
};

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
        preOp?: (payload: any) => Promise<any>;
        postOp?: () => void;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        let payload = req.body;
        if (options.preOp) {
            payload = await options.preOp(payload);
        }

        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return sendValidationError(req, res, parsed.error);
        }

        const data = parsed.data;
        if (options.slugifyName && data.name) {
            data.slug = slugify(data.name, { lower: true, strict: true }) + '-' + nanoid(6);
        }

        const item = await model.create(data);

        if (options.postOp) options.postOp();

        if (options.auditAction) {
            logAdminAction(req, options.auditAction as any, model.modelName as any, item._id as any, { data });
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
        preUpdate?: (id: string, payload: any, existing: T) => Promise<any>;
        postOp?: () => void;
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

        let payload = req.body;
        if (options.preUpdate) {
            payload = await options.preUpdate(id, payload, existing);
        }

        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return sendValidationError(req, res, parsed.error);
        }

        const data = parsed.data;
        if (options.slugifyName && data.name) {
            data.slug = slugify(data.name, { lower: true, strict: true });
        }

        const item = await model.findByIdAndUpdate(id, data, { new: true });
        
        if (options.postOp) options.postOp();

        if (options.auditAction) {
            logAdminAction(req, options.auditAction as any, model.modelName as any, item!._id as any, { updates: data });
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
        postOp?: () => void;
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

        const isActive = !(item as any).isActive;
        const status = isActive ? CATALOG_STATUS.ACTIVE : CATALOG_STATUS.INACTIVE;
        const nextState = model.schema.path('status')
            ? { isActive, status }
            : { isActive };

        await model.findByIdAndUpdate(req.params.id, nextState);
        
        if (options.postOp) options.postOp();

        if (options.auditAction) {
            logAdminAction(req, options.auditAction as any, model.modelName as any, item._id as any, { isActive, status });
        }

        return sendSuccessResponse(res, nextState, `${model.modelName} status updated to ${status}`);
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
    checkDependencies?: (id: string) => Promise<{ count: number; details: any }>,
    options: { 
        auditAction?: string;
        postOp?: () => void;
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

        const softDeleteUpdate = model.schema.path('status')
            ? { isDeleted: true, status: CATALOG_STATUS.INACTIVE }
            : { isDeleted: true };

        const item = await model.findByIdAndUpdate(id, softDeleteUpdate, { new: true });
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${model.modelName} not found`);
        }

        if (options.postOp) options.postOp();

        if (options.auditAction) {
            logAdminAction(req, options.auditAction as any, model.modelName as any, item._id as any);
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
        postOp?: () => void;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        let updates: any = {};
        if (action === 'APPROVE') {
            updates = { status: CATALOG_STATUS.ACTIVE, isActive: true };
        } else {
            const parsed = schema?.safeParse(req.body);
            if (schema && !parsed?.success) {
                return sendValidationError(req, res, parsed!.error);
            }
            updates = {
                status: CATALOG_STATUS.REJECTED,
                isActive: false,
                rejectionReason: parsed?.data?.reason || req.body.reason
            };
        }

        const item = await model.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${model.modelName} not found`);
        }

        if (options.postOp) options.postOp();

        if (options.auditAction) {
            logAdminAction(req, options.auditAction as any, model.modelName as any, item._id as any, { updates });
        }

        return sendSuccessResponse(res, item as any, `${model.modelName} ${action.toLowerCase()}d successfully`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}
