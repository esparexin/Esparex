import mongoose, { Document } from 'mongoose';
import { Request, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import logger from '@esparex/core/utils/logger';
import { respond, sendSuccessResponse } from "../../../utils/respond";
import { sendErrorResponse as sendContractErrorResponse, sendCatalogError } from "../../../utils/errorResponse";
import { isDuplicateKeyError } from '@esparex/core/utils/errorHelpers';
import { CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
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
import { toOptionalString } from './inputCoercion';
import { setCache } from '@esparex/core/utils/redisCache';
import { getVariantsAndModelsForParentModels, getBrandModelsForDuplicateCheck } from '@esparex/core/services/catalog/CatalogBrandModelService';
import { validateModelHierarchyMutation } from '@esparex/core/services/catalog/CatalogHierarchyService';
import { detectDuplicateCandidates } from '@esparex/core/services/catalog/CatalogSearchGovernanceService';

export {
    sendCatalogError,
    sendSuccessResponse,
    handlePaginatedContent,
    ACTIVE_CATEGORY_QUERY,
    ACTIVE_BRAND_QUERY,
    CATALOG_PUBLIC_VISIBILITY_QUERY,
    getActiveCategoryIds,
    validateActiveCategories,
    deriveApprovalStatus,
    isDuplicateKeyError
};

export type CatalogRequest = Request & {
    user?: { role?: string; id?: string; _id?: string | { toString: () => string } };
    admin?: { id?: string; _id?: string | { toString: () => string } };
};

export type QueryRecord = Record<string, unknown>;

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

/* ======================================================
   GENERIC CATALOG CRUD HANDLERS
====================================================== */

/**
 * GENERIC CREATE
 */
export async function handleCatalogCreate<T extends Document>(
    req: Request,
    res: Response,
    entityName: string,
    schema: z.ZodTypeAny,
    createOp: (data: Partial<T>) => Promise<T>,
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

        const item = await createOp(data as unknown as Partial<T>);

        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, entityName as Parameters<typeof logAdminAction>[2], item._id, { data });
        }

        return sendSuccessResponse(res, item, `${entityName} created successfully`);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendContractErrorResponse(req, res, 400, `${entityName} already exists`);
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
    entityName: string,
    schema: z.ZodTypeAny,
    findByIdOp: (id: string) => Promise<T | null>,
    updateOp: (id: string, data: Partial<T>) => Promise<T | null>,
    options: {
        auditAction?: string;
        slugifyName?: boolean;
        preUpdate?: (id: string, payload: Record<string, unknown>, existing: T) => Promise<Record<string, unknown>>;
        postOp?: (item: T) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const id = String(req.params.id);
        const existing = await findByIdOp(id);
        if (!existing) {
            return sendContractErrorResponse(req, res, 404, `${entityName} not found`);
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

        const item = await updateOp(id, data as unknown as Partial<T>);
        
        if (options.postOp && item) void options.postOp(item as T);

        if (options.auditAction) {
            const auditItem = item as { _id?: string | { toString: () => string } } | null;
            void logAdminAction(req, options.auditAction, entityName as Parameters<typeof logAdminAction>[2], auditItem?._id, { updates: data });
        }

        return sendSuccessResponse(res, item, `${entityName} updated successfully`);
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendContractErrorResponse(req, res, 400, `${entityName} already exists`);
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
    entityName: string,
    findByIdOp: (id: string) => Promise<T | null>,
    updateOp: (id: string, data: Partial<T>) => Promise<T | null>,
    hasCategoryIds: boolean = false,
    hasApprovalStatus: boolean = false,
    options: { 
        auditAction?: string;
        postOp?: (item: T) => void | Promise<void>;
    } = {}
) {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const item = await findByIdOp(String(req.params.id));
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${entityName} not found`);
        }

        const isActive = !(item as T & { isActive?: boolean }).isActive;
        const typedItem = item as T & { approvalStatus?: unknown; isActive?: boolean; categoryIds?: string[] };

        if (isActive && hasCategoryIds && (!typedItem.categoryIds || typedItem.categoryIds.length === 0)) {
            return sendContractErrorResponse(req, res, 400, 'Cannot activate brand/model with no assigned categories');
        }

        const approvalStatus = deriveApprovalStatus({
            approvalStatus: typedItem.approvalStatus,
            isActive: typedItem.isActive,
            fallback: CATALOG_APPROVAL_STATUS.APPROVED,
        });
        const nextState: Record<string, unknown> = { isActive };
        if (hasApprovalStatus) {
            nextState.approvalStatus = approvalStatus;
        }

        await updateOp(String(req.params.id), nextState as Partial<T>);
        
        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, entityName as Parameters<typeof logAdminAction>[2], item._id, { isActive, approvalStatus });
        }

        return sendSuccessResponse(res, nextState, `${entityName} status updated to ${isActive ? 'active' : 'inactive'}`);
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
    entityName: string,
    updateOp: (id: string, data: Partial<T>) => Promise<T | null>,
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
                return sendContractErrorResponse(req, res, 400, `Cannot delete ${entityName} with active dependencies`, { details: deps.details });
            }
        }

        const softDeleteUpdate: Record<string, unknown> = {
            isDeleted: true,
            deletedAt: new Date(),
            isActive: false,
        };

        const item = await updateOp(id, softDeleteUpdate as Partial<T>);
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${entityName} not found`);
        }

        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, entityName as Parameters<typeof logAdminAction>[2], item._id);
        }

        return sendSuccessResponse(res, null, `${entityName} deleted successfully`);
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
    entityName: string,
    action: 'APPROVE' | 'REJECT',
    updateOp: (id: string, data: Partial<T>) => Promise<T | null>,
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

        const item = await updateOp(String(req.params.id), updates as Partial<T>);
        if (!item) {
            return sendContractErrorResponse(req, res, 404, `${entityName} not found`);
        }

        if (options.postOp) void options.postOp(item as T);

        if (options.auditAction) {
            void logAdminAction(req, options.auditAction, entityName as Parameters<typeof logAdminAction>[2], item._id, { updates });
        }

        return sendSuccessResponse(res, item, `${entityName} ${action.toLowerCase()}d successfully`);
    } catch (error) {
        return sendCatalogError(req, res, error);
    }
}

/* ======================================================
   ADMIN CATALOG SHARED HELPERS
====================================================== */

export const CATALOG_CACHE_TTL = 300;

export const normalizeCacheValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.map(normalizeCacheValue).join(',');
    if (value === undefined || value === null || value === '') return 'all';
    return encodeURIComponent(String(value));
};

export const catalogCacheKey = {
    brands: (categoryId: string) => `catalog:brands:${normalizeCacheValue(categoryId)}`,
    models: (params: {
        categoryId?: unknown; brandId?: unknown; parentModelId?: unknown; variantModelId?: unknown;
        includeVariants?: unknown; treeView?: unknown; search?: unknown; q?: unknown;
        page?: unknown; limit?: unknown; sort?: unknown;
    }) => ['catalog:models', `category=${normalizeCacheValue(params.categoryId)}`, `brand=${normalizeCacheValue(params.brandId)}`,
        `parent=${normalizeCacheValue(params.parentModelId)}`, `variant=${normalizeCacheValue(params.variantModelId)}`,
        `includeVariants=${normalizeCacheValue(params.includeVariants)}`, `treeView=${normalizeCacheValue(params.treeView)}`,
        `search=${normalizeCacheValue(params.search ?? params.q)}`, `page=${normalizeCacheValue(params.page ?? 1)}`,
        `limit=${normalizeCacheValue(params.limit ?? 100)}`, `sort=${normalizeCacheValue(params.sort ?? 'name')}`,
    ].join(':'),
};

export const normalizeOptionalObjectIdQuery = (value: unknown): string | undefined => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== 'string') return undefined;
    const normalized = raw.trim();
    if (!normalized || normalized === 'all') return undefined;
    return mongoose.Types.ObjectId.isValid(normalized) ? normalized : undefined;
};

export const normalizeBooleanQuery = (value: unknown): boolean => {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === true || raw === 'true' || raw === '1';
};

export const populateModelVariants = async (items: unknown[]) => {
    const modelIds = items.map((item) => { const m = item as { _id?: unknown; id?: unknown }; return m._id ?? m.id; }).filter(Boolean).map(String);
    if (modelIds.length === 0) return items;
    const [variantDocs, variantModelDocs] = await getVariantsAndModelsForParentModels(modelIds);
    const variantsByModelId = new Map<string, unknown[]>();
    for (const v of variantDocs) { const mid = String((v as { modelId?: unknown }).modelId ?? ''); if (!mid) continue; const ex = variantsByModelId.get(mid) ?? []; ex.push(v); variantsByModelId.set(mid, ex); }
    const variantModelsByParentId = new Map<string, unknown[]>();
    for (const vm of variantModelDocs) { const pid = String((vm as { variantOfModelId?: unknown }).variantOfModelId ?? ''); if (!pid) continue; const ex = variantModelsByParentId.get(pid) ?? []; ex.push(vm); variantModelsByParentId.set(pid, ex); }
    return items.map((item) => {
        const plain = typeof (item as { toObject?: () => unknown }).toObject === 'function' ? (item as { toObject: () => Record<string, unknown> }).toObject() : { ...(item as Record<string, unknown>) };
        const id = String(plain._id ?? plain.id ?? '');
        return { ...plain, variants: variantsByModelId.get(id) ?? [], variantModels: variantModelsByParentId.get(id) ?? [] };
    });
};

export const applyModelHierarchyPayload = async (payload: Record<string, unknown>, options: { existingModel?: unknown } = {}) => {
    const normalizedPayload = {
        ...payload,
        brandId: toOptionalString(payload.brandId) ?? payload.brandId,
        parentModelId: payload.parentModelId === null ? null : toOptionalString(payload.parentModelId) ?? payload.parentModelId,
        variantOfModelId: payload.variantOfModelId === null ? null : toOptionalString(payload.variantOfModelId) ?? payload.variantOfModelId,
    };
    return validateModelHierarchyMutation(normalizedPayload, { existingModel: options.existingModel as any });
};

export const logModelDuplicateCandidates = async (req: Request, payload: Record<string, unknown>, options: { excludeId?: string } = {}) => {
    const name = String(payload.displayName ?? payload.name ?? payload.canonicalName ?? '').trim();
    const brandId = toOptionalString(payload.brandId);
    if (!name || !brandId) return;
    const candidates = await getBrandModelsForDuplicateCheck(brandId, options.excludeId);
    const dupes = detectDuplicateCandidates(name, candidates as unknown as Record<string, unknown>[]);
    if (dupes.length > 0) logger.warn('[CatalogSearch] Potential model duplicate candidates detected', { requestPath: req.originalUrl || req.path, candidateCount: dupes.length, input: name, candidates: dupes });
};

export const applyCacheWriteThrough = (res: Response, cacheKey: string) => {
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
        if (res.statusCode >= 200 && res.statusCode < 300) setCache(cacheKey, body, CATALOG_CACHE_TTL).catch(() => {});
        return originalJson(body);
    };
};

import CatalogOrchestrator from '@esparex/core/services/catalog/CatalogOrchestrator';

export const invalidateItemCatalogCache = (item: any) => void CatalogOrchestrator.invalidateCatalogCache({
    categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []),
    brandIds: item.brandId ? [item.brandId] : []
});
