/**
 * Shared utilities for catalog controllers
 * Extracted from original catalog.content.controller.ts
 *
 * Validation logic is delegated to CatalogValidationService (SSOT).
 * Re-exports keep existing controller imports stable.
 */

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { respond, sendSuccessResponse } from "../../../utils/respond";
import { sendErrorResponse as sendContractErrorResponse, sendCatalogError } from "../../../utils/errorResponse";
import { isDuplicateKeyError } from '@esparex/core';
import type { CatalogAdminEntity, CatalogAdminRepository } from './catalogPortRepositories';

// Re-export SSOT validation helpers so controllers import from one place.
import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
import {
    ACTIVE_CATEGORY_QUERY,
    ACTIVE_BRAND_QUERY,
    CATALOG_PUBLIC_VISIBILITY_QUERY,
    getActiveCategoryIds,
    validateActiveCategories,
    deriveApprovalStatus,
} from '@esparex/core';

import { logAdminAction } from '../../../utils/adminLogger';
import { handlePaginatedContent } from "../../../utils/content-handler";
import { isAdminRole } from '@esparex/core';
import { CatalogOrchestrator } from '@esparex/core';
import { clearCategoryCanonicalCache } from '@esparex/core';

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

/** Entity id for audit logging — port entities carry `_id` (string). */
const getEntityId = (item: CatalogAdminEntity | null | undefined): string | { toString(): string } | undefined => {
    if (!item) return undefined;
    return item._id ?? item.id;
};

export type CatalogStatusFilterToken =
    | 'live'
    | 'active'
    | 'inactive'
    | 'deactivated'
    | 'pending'
    | 'rejected';

export const applyCatalogStatusFilter = (
    targetQuery: QueryRecord,
    rawStatus: unknown,
    rawIsActive?: unknown,
    rawApprovalStatus?: unknown
) => {
    if (typeof rawIsActive === 'boolean') {
        targetQuery.isActive = rawIsActive;
    } else if (typeof rawIsActive === 'string') {
        const cleanIsActive = rawIsActive.trim().toLowerCase();
        if (cleanIsActive === 'true') targetQuery.isActive = true;
        if (cleanIsActive === 'false') targetQuery.isActive = false;
    }

    if (typeof rawApprovalStatus === 'string') {
        const cleanApproval = rawApprovalStatus.trim().toLowerCase();
        if (cleanApproval === 'approved' || cleanApproval === 'pending' || cleanApproval === 'rejected') {
            targetQuery.approvalStatus = cleanApproval;
        }
    }

    if (typeof rawStatus !== 'string') return;
    const status = rawStatus.trim().toLowerCase();
    if (!status || status === 'all') return;

    if (status === 'live' || status === 'active') {
        if (targetQuery.isActive === undefined) targetQuery.isActive = true;
        if (targetQuery.approvalStatus === undefined) targetQuery.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
        return;
    }
    if (status === 'inactive' || status === 'deactivated') {
        if (targetQuery.isActive === undefined) targetQuery.isActive = false;
        return;
    }
    if (status === 'pending') {
        if (targetQuery.approvalStatus === undefined) targetQuery.approvalStatus = CATALOG_APPROVAL_STATUS.PENDING;
        return;
    }
    if (status === 'rejected') {
        if (targetQuery.approvalStatus === undefined) targetQuery.approvalStatus = CATALOG_APPROVAL_STATUS.REJECTED;
    }
};

/**
 * Check if request has admin access
 */
export const hasAdminAccess = (req: Request): boolean => {
    const catalogRequest = req as CatalogRequest;
    const role = catalogRequest.user?.role;
    return isAdminRole(role);
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
 * GENERIC CREATE — data access via the catalog repository port (P1-8).
 */
export async function handleCatalogCreate(
    req: Request,
    res: Response,
    repository: CatalogAdminRepository,
    schema: z.ZodTypeAny,
    options: {
        auditAction?: string;
        slugifyName?: boolean;
        preOp?: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
        postOp?: (item: CatalogAdminEntity) => void | Promise<void>;
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

        const item = await repository.create(data);

        if (options.postOp) void options.postOp(item);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, repository.entityName as Parameters<typeof logAdminAction>[2], getEntityId(item), { data });
        }

        return sendSuccessResponse(res, item, `${repository.entityName} created successfully`);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendContractErrorResponse(req, res, 400, `${repository.entityName} already exists`);
        }
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC UPDATE — data access via the catalog repository port (P1-8).
 */
export async function handleCatalogUpdate(
    req: Request,
    res: Response,
    repository: CatalogAdminRepository,
    schema: z.ZodTypeAny,
    options: {
        auditAction?: string;
        slugifyName?: boolean;
        preUpdate?: (id: string, payload: Record<string, unknown>, existing: CatalogAdminEntity) => Promise<Record<string, unknown>>;
        updateOp?: (id: string, data: Record<string, unknown>, existing: CatalogAdminEntity) => Promise<CatalogAdminEntity | unknown>;
        postOp?: (item: CatalogAdminEntity) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const id = String(req.params.id);
        const existing = await repository.findById(id);
        if (!existing) {
            return sendContractErrorResponse(req, res, 404, `${repository.entityName} not found`);
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
            : await repository.update(id, data);
        
        if (options.postOp) void options.postOp(item as CatalogAdminEntity);

        if (options.auditAction) {
            const auditItem = item as CatalogAdminEntity | null;
            void logAdminAction(req, options.auditAction, repository.entityName as Parameters<typeof logAdminAction>[2], getEntityId(auditItem), { updates: data });
        }

        return sendSuccessResponse(res, item, `${repository.entityName} updated successfully`);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendContractErrorResponse(req, res, 400, `${repository.entityName} already exists`);
        }
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC TOGGLE STATUS — data access via the catalog repository port (P1-8).
 */
export async function handleCatalogToggleStatus(
    req: Request,
    res: Response,
    repository: CatalogAdminRepository,
    options: { 
        auditAction?: string;
        postOp?: (item: CatalogAdminEntity) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const item = await repository.findById(String(req.params.id));
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${repository.entityName} not found`);
        }

        const isActive = !item.isActive;

        if (isActive && repository.supportsCategoryIds && (!item.categoryIds || item.categoryIds.length === 0)) {
            return sendContractErrorResponse(req, res, 400, 'Cannot activate brand/model with no assigned categories');
        }

        const approvalStatus = deriveApprovalStatus({
            approvalStatus: item.approvalStatus,
            isActive: item.isActive,
            fallback: CATALOG_APPROVAL_STATUS.APPROVED,
        });
        const nextState: Record<string, unknown> = { isActive };
        if (repository.supportsApprovalStatus) {
            nextState.approvalStatus = approvalStatus;
        }

        await repository.update(String(req.params.id), nextState);
        
        if (options.postOp) void options.postOp(item);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, repository.entityName as Parameters<typeof logAdminAction>[2], getEntityId(item), { isActive, approvalStatus });
        }

        return sendSuccessResponse(res, nextState, `${repository.entityName} status updated to ${isActive ? 'active' : 'inactive'}`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC DELETE — data access via the catalog repository port (P1-8).
 */
export async function handleCatalogDelete(
    req: Request,
    res: Response,
    repository: CatalogAdminRepository,
    checkDependencies?: (id: string) => Promise<{ count: number; details: unknown }>,
    options: { 
        auditAction?: string;
        postOp?: (item: CatalogAdminEntity) => void | Promise<void>;
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
                return sendContractErrorResponse(req, res, 400, `Cannot delete ${repository.entityName} with active dependencies`, { details: deps.details });
            }
        }

        const softDeleteUpdate: Record<string, unknown> = {
            isDeleted: true,
            deletedAt: new Date(),
            isActive: false,
        };

        const item = await repository.update(id, softDeleteUpdate);
        if (!item) {
            const alreadyDeletedDoc = await repository.findByIdIncludingDeleted(id);
            if (alreadyDeletedDoc && alreadyDeletedDoc.isDeleted) {
                if (options.postOp) void options.postOp(alreadyDeletedDoc);
                return sendSuccessResponse(res, { alreadyDeleted: true }, `${repository.entityName} was already deleted`);
            }
            return sendContractErrorResponse(req, res, 404, `${repository.entityName} not found`);
        }

        if (options.postOp) void options.postOp(item);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, repository.entityName as Parameters<typeof logAdminAction>[2], getEntityId(item));
        }

        return sendSuccessResponse(res, null, `${repository.entityName} deleted successfully`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}

/**
 * GENERIC REVIEW (APPROVE/REJECT) — data access via the catalog repository port (P1-8).
 */
export async function handleCatalogReview(
    req: Request,
    res: Response,
    repository: CatalogAdminRepository,
    action: 'APPROVE' | 'REJECT',
    schema?: z.ZodTypeAny,
    options: { 
        auditAction?: string;
        postOp?: (item: CatalogAdminEntity) => void | Promise<void>;
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


        const item = await repository.update(String(req.params.id), updates);
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${repository.entityName} not found`);
        }

        if (options.postOp) void options.postOp(item);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, repository.entityName as Parameters<typeof logAdminAction>[2], getEntityId(item), { updates });
        }

        return sendSuccessResponse(res, item, `${repository.entityName} ${action.toLowerCase()}d successfully`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}

export interface CatalogCacheInvalidationItem {
    categoryIds?: Array<string | Types.ObjectId>;
    categoryId?: string | Types.ObjectId;
    brandId?: string | Types.ObjectId;
}

export const invalidateItemCatalogCache = (item: CatalogCacheInvalidationItem) => {
    const categoryIds = (item.categoryIds as string[] | undefined) || (item.categoryId ? [String(item.categoryId)] : []);
    const brandIds = item.brandId ? [String(item.brandId)] : [];
    clearCategoryCanonicalCache();
    void CatalogOrchestrator.invalidateCatalogCache({
        categoryIds,
        brandIds
    });
};
