/**
 * Catalog Spare Parts Controller
 * Handles spare parts and user proposals
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import logger from '@esparex/core/utils/logger';
import { handlePaginatedContent } from "../../../utils/contentHandler";
import mongoose from 'mongoose';
import slugify from 'slugify';
import { sendSuccessResponse } from "../../../utils/respond";
import {
    findCategoryIdBySlug,
    getActiveBrandIdsForCategories,
    getActiveModelIdsForCategories,
    findSparePartById,
    checkSparePartDependencies,
} from '@esparex/core/services/catalog/CatalogSparePartService';
import { resolveEquivalentActiveCategoryIds } from '@esparex/core/services/catalog/CatalogCategoryService';
import {
    sendCatalogError,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    validateActiveCategories,
    getActiveCategoryIds,
    handleCatalogCreate,
    handleCatalogUpdate,
    handleCatalogToggleStatus,
    handleCatalogDelete,
    sendEmptyPublicList,
    getAdminActorId,
    applyCatalogStatusFilter,
    CATALOG_PUBLIC_VISIBILITY_QUERY,
    deriveApprovalStatus
} from './shared';
import { invalidateItemCatalogCache } from './shared';
import { validateSparePartRelations } from '@esparex/core/services/catalog/CatalogValidationService';
import {
    sparePartCreateSchema,
    sparePartUpdateSchema
} from '@esparex/core/validators/catalog.validator';
import CategoryQueryBuilder from '@esparex/core/utils/CategoryQueryBuilder';
import { LISTING_TYPE, ListingTypeValue } from "@esparex/contracts";
import { getCache, setCache } from '@esparex/core/utils/redisCache';
import { CATALOG_APPROVAL_STATUS } from "@esparex/contracts";
import { toOptionalString, toStringArray } from './inputCoercion';

// ── Cache helpers ──────────────────────────────────────────────────────────
const CATALOG_CACHE_TTL = 300; // 5 minutes
const sparePartsCacheKey = (categoryId: string, listingType?: string) =>
    `catalog:spare-parts:${categoryId}:${listingType ?? 'all'}`;

// ── Helper: Normalize listing type from query params ──────────────────────
const normalizeListingTypeFromQuery = (listingTypeParam?: unknown): ListingTypeValue | undefined => {
    const value = listingTypeParam;
    if (typeof value !== 'string') return undefined;
    if (value === LISTING_TYPE.AD || value === LISTING_TYPE.SPARE_PART) {
        return value;
    }
    return undefined;
};

// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// SparePart CRUD now delegated to shared.ts generic handlers.

/**
 * Get spare parts for PUBLIC view (strict validation, active categories only)
 */
const getSparePartsPublic = async (req: Request, res: Response) => {
    const categoryParam = (req.query.categoryId || req.query.category) as string | undefined;
    const requestedListingType = normalizeListingTypeFromQuery(req.query.listingType);

    let categoryObjectId: string | undefined = categoryParam;
    
    // Resolve category slug to ObjectId if needed
    if (categoryParam && !mongoose.Types.ObjectId.isValid(categoryParam)) {
        const resolvedCategoryId = await findCategoryIdBySlug(categoryParam, ACTIVE_CATEGORY_QUERY);
        if (!resolvedCategoryId) {
            logger.debug('[Catalog] Category not found (public)', { categorySlug: categoryParam });
            return sendEmptyPublicList(res);
        }
        categoryObjectId = resolvedCategoryId;
    }

    // Validate category is active
    if (categoryObjectId) {
        const activeCategoryValidation = await validateActiveCategories([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            logger.debug('[Catalog] Category not active (public)', { categoryId: categoryObjectId, invalidCategoryIds: activeCategoryValidation.invalidCategoryIds });
            return sendEmptyPublicList(res);
        }
    }

    // Get active categories
    const activeCategoryIds = categoryObjectId
        ? await resolveEquivalentActiveCategoryIds(categoryObjectId)
        : await getActiveCategoryIds();

    if (activeCategoryIds.length === 0) {
        logger.warn('[Catalog] No active categories found for spare parts query', { categoryParam });
        return sendEmptyPublicList(res);
    }

    // Fetch active brands and models for filtering
    const [activeBrandIds, activeModelIds] = await Promise.all([
        getActiveBrandIdsForCategories(activeCategoryIds),
        getActiveModelIdsForCategories(activeCategoryIds)
    ]);

    // Build public query
    const publicQuery: QueryRecord = {
        ...CATALOG_PUBLIC_VISIBILITY_QUERY,
        ...CategoryQueryBuilder.forPlural().withFilters({ categoryIds: activeCategoryIds }).build()
    };
    publicQuery.$and = [
        {
            $or: [
                { brandId: { $exists: false } },
                { brandId: null },
                { brandId: { $in: activeBrandIds } }
            ]
        },
        {
            $or: [
                { modelId: { $exists: false } },
                { modelId: null },
                { modelId: { $in: activeModelIds } }
            ]
        }
    ];

    if (requestedListingType) {
        publicQuery.listingType = requestedListingType;
    }

    logger.debug('[Catalog] getSparePartsPublic query', {
        categoryId: categoryObjectId,
        activeCategoryIds: activeCategoryIds.length,
        activeBrandIds: activeBrandIds.length,
        activeModelIds: activeModelIds.length,
        listingType: requestedListingType
    });

    // ── Redis cache ─────────────────────────────────────────────────────────
    const cacheKey = sparePartsCacheKey(categoryObjectId ?? 'all', requestedListingType);
    const cached = await getCache<unknown>(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            setCache(cacheKey, body, CATALOG_CACHE_TTL).catch(() => { /* silent */ });
        }
        return originalJson(body);
    };

    // Clean query params
    const cleanQuery = { ...req.query };

    return handlePaginatedContent(req, res, 'SparePart', {
        publicQuery,
        queryParams: cleanQuery,
        searchFields: ['name', 'canonicalName', 'aliases'],
        defaultSort: { sortOrder: 1 }
    });
};

/**
 * Get spare parts for ADMIN view (no validation, all categories/statuses)
 */
const getSparePartsAdmin = async (req: Request, res: Response) => {
    const { status } = req.query;
    const categoryParam = (req.query.categoryId || req.query.category) as string | undefined;
    const requestedListingType = normalizeListingTypeFromQuery(req.query.listingType);

    let categoryObjectId: string | undefined = categoryParam;

    // Resolve category slug to ObjectId if needed
    if (categoryParam && !mongoose.Types.ObjectId.isValid(categoryParam)) {
        const resolvedCategoryId = await findCategoryIdBySlug(categoryParam);
        if (resolvedCategoryId) {
            categoryObjectId = resolvedCategoryId;
        } else {
            logger.debug('[Catalog] Category not found (admin)', { categorySlug: categoryParam });
        }
    }

    // Build admin query
    const adminQuery: QueryRecord = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    applyCatalogStatusFilter(adminQuery, status);
    if (requestedListingType) {
        adminQuery.listingType = requestedListingType;
    }

    logger.debug('[Catalog] getSparePartsAdmin query', {
        categoryId: categoryObjectId,
        listingType: requestedListingType,
        status
    });

    // Clean query params
    const cleanQuery = { ...req.query };
    delete cleanQuery.placement;
    delete cleanQuery.status;

    return handlePaginatedContent(req, res, 'SparePart', {
        adminQuery,
        queryParams: cleanQuery,
        searchFields: ['name', 'canonicalName', 'aliases'],
        defaultSort: { sortOrder: 1 }
    });
};

/**
 * Get all spare parts (routes to public or admin handler)
 */
export const getSpareParts = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    return isAdminView ? getSparePartsAdmin(req, res) : getSparePartsPublic(req, res);
};

/**
 * Create new spare part (admin only)
 */
export const createSparePart = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, 'SparePart', sparePartCreateSchema,
        async (data) => mongoose.model('SparePart').create(data),
        {
        auditAction: 'SPARE_PART_CREATE',
        slugifyName: true,
        preOp: async (payload) => {
            const categoryIds = toStringArray(payload.categoryIds);
            const validatedCategoryIds = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryIds ?? null }).getRawIds();
            const brandId = toOptionalString(payload.brandId);
            const modelId = toOptionalString(payload.modelId);
            if (categoryIds) payload.categoryIds = categoryIds;
            if (brandId) payload.brandId = brandId;
            if (modelId) payload.modelId = modelId;
            const relation = await validateSparePartRelations({ categoryIds: validatedCategoryIds, brandId, modelId });
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');

            payload.createdBy = getAdminActorId(req);
            const listingType = toStringArray(payload.listingType);
            payload.listingType = listingType?.length ? listingType : [LISTING_TYPE.SPARE_PART];
            payload.usageCount = 0;
            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus,
                isActive: payload.isActive as boolean | undefined,
                fallback: CATALOG_APPROVAL_STATUS.APPROVED,
            });
            
            return payload;
        },
        postOp: invalidateItemCatalogCache
    });
};

/**
 * Update existing spare part
 */
export const updateSparePart = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, 'SparePart', sparePartUpdateSchema,
        async (id) => mongoose.model('SparePart').findById(id),
        async (id, data) => mongoose.model('SparePart').findByIdAndUpdate(id, data, { new: true }),
        {
        auditAction: 'SPARE_PART_UPDATE',
        preUpdate: async (id, payload, existingPart) => {
            if (payload.name) payload.slug = slugify(payload.name as string, { lower: true, strict: true });

            // Use renamed categoryIds from and to payload
            const typedPart = existingPart as { categoryIds?: unknown[]; brandId?: unknown; modelId?: unknown };
            const nextCategories = toStringArray(payload.categoryIds) ?? toStringArray(typedPart.categoryIds) ?? [];
            const nextBrandId = toOptionalString(payload.brandId) ?? toOptionalString(typedPart.brandId);
            const nextModelId = toOptionalString(payload.modelId) ?? toOptionalString(typedPart.modelId);
            if (payload.categoryIds !== undefined) payload.categoryIds = nextCategories;
            if (payload.brandId !== undefined && nextBrandId) payload.brandId = nextBrandId;
            if (payload.modelId !== undefined && nextModelId) payload.modelId = nextModelId;
            const relation = await validateSparePartRelations({
                categoryIds: nextCategories,
                brandId: nextBrandId,
                modelId: nextModelId
            });
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');

            payload.approvalStatus = deriveApprovalStatus({
                approvalStatus: payload.approvalStatus ?? (existingPart as { approvalStatus?: unknown }).approvalStatus,
                isActive: (payload.isActive ?? (existingPart as { isActive?: boolean }).isActive) as boolean | undefined,
                fallback: CATALOG_APPROVAL_STATUS.APPROVED,
            });

            return payload;
        },
        postOp: invalidateItemCatalogCache
    });
};

/**
 * Toggle spare part status
 */
export const toggleSparePartStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, 'SparePart',
        async (id) => mongoose.model('SparePart').findById(id),
        async (id, data) => mongoose.model('SparePart').findByIdAndUpdate(id, data, { new: true }),
        true, true,
        {
        auditAction: 'TOGGLE_SPARE_PART_STATUS',
        postOp: invalidateItemCatalogCache
    });
};

/**
 * Delete spare part (soft delete with dependency check)
 */
export const deleteSparePart = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, 'SparePart',
        async (id, data) => mongoose.model('SparePart').findByIdAndUpdate(id, data, { new: true }),
        checkSparePartDependencies, {
        auditAction: 'SPARE_PART_DELETE',
        postOp: invalidateItemCatalogCache
    });
};

/**
 * Get single spare part by ID
 */
export const getSparePartById = async (req: Request, res: Response) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const sparePart = await findSparePartById(req.params.id as string);
        if (!sparePart) return sendCatalogError(req, res, 'Spare part not found', 404);
        if (!isAdminView) {
            const typed = sparePart as { approvalStatus?: string; isActive?: boolean; isDeleted?: boolean; deletedAt?: Date | null };
            if (
                typed.approvalStatus !== CATALOG_APPROVAL_STATUS.APPROVED ||
                typed.isActive !== true ||
                typed.isDeleted === true ||
                typed.deletedAt
            ) {
                return sendCatalogError(req, res, 'Spare part not found', 404);
            }
        }
        sendSuccessResponse(res, sparePart);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};
