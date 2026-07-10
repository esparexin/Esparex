import { Request, Response } from 'express';
import logger from '@esparex/core/utils/logger';
import { sendSuccessResponse } from '../../../utils/respond';
import { handlePaginatedContent } from '../../../utils/contentHandler';
import mongoose from 'mongoose';
import { CATALOG_APPROVAL_STATUS } from '@esparex/shared';
import { CatalogModel, findCategoryBySlugForCatalog, getActiveBrandIds, checkBrandInCategories, checkModelDependencies, findModelByFilter, findModelBySlug } from '@esparex/core/services/catalog/CatalogBrandModelService';
import { validateBrandIsActive } from '@esparex/core/services/catalog/CatalogValidationService';
import CatalogOrchestrator from '@esparex/core/services/catalog/CatalogOrchestrator';
import { sendCatalogError, QueryRecord, ACTIVE_CATEGORY_QUERY, validateActiveCategories, getActiveCategoryIds, handleCatalogCreate, handleCatalogUpdate, handleCatalogToggleStatus, handleCatalogDelete, handleCatalogReview, sendEmptyPublicList, applyCatalogStatusFilter, CATALOG_PUBLIC_VISIBILITY_QUERY, deriveApprovalStatus } from './shared';
import { toOptionalString, toStringArray } from './inputCoercion';
import { modelCreateSchema, modelUpdateSchema, rejectionSchema } from '@esparex/core/validators/catalog.validator';
import CategoryQueryBuilder from '@esparex/core/utils/CategoryQueryBuilder';
import { MAX_MODEL_TREE_DEPTH } from '@esparex/core/services/catalog/CatalogHierarchyService';
import { updateModelHierarchyTransactionally } from '@esparex/core/services/catalog/CatalogHierarchyService';
import { getCache } from '@esparex/core/utils/redisCache';
import { catalogCacheKey, applyCacheWriteThrough, normalizeOptionalObjectIdQuery, normalizeBooleanQuery, populateModelVariants, applyModelHierarchyPayload, logModelDuplicateCandidates } from './adminCatalogShared';

export const getModels = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { brandId } = req.query;
    const brandObjectId = (typeof brandId === 'string' && brandId !== 'all') ? brandId : undefined;
    const parentModelId = normalizeOptionalObjectIdQuery(req.query.parentModelId);
    const variantModelId = normalizeOptionalObjectIdQuery(req.query.variantModelId);
    const includeVariants = normalizeBooleanQuery(req.query.includeVariants);
    const treeView = normalizeBooleanQuery(req.query.treeView);
    const categoryId = req.query.categoryId as string;
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    let categoryObjectId: string | undefined = (categoryId && categoryId !== 'all') ? categoryId : undefined;
    if (!isAdminView && categoryId && categoryId !== 'all' && !mongoose.Types.ObjectId.isValid(categoryId)) {
        const cat = await findCategoryBySlugForCatalog(categoryId, ACTIVE_CATEGORY_QUERY);
        if (cat) categoryObjectId = cat._id.toString();
    }
    if (!isAdminView) {
        const cacheKey = catalogCacheKey.models({ categoryId: categoryObjectId, brandId: brandObjectId, parentModelId, variantModelId, includeVariants: req.query.includeVariants, treeView: req.query.treeView, search: req.query.search, q: req.query.q, page: req.query.page, limit: req.query.limit, sort: req.query.sort });
        const cached = await getCache<unknown>(cacheKey);
        if (cached) return res.json(cached);
        applyCacheWriteThrough(res, cacheKey);
    }
    if (!isAdminView && categoryObjectId) {
        const v = await validateActiveCategories([categoryObjectId]);
        if (!v.ok) return sendEmptyPublicList(res);
    }
    let activeCategoryIds: string[] = [];
    if (!isAdminView) { activeCategoryIds = categoryObjectId ? [categoryObjectId] : await getActiveCategoryIds(); if (activeCategoryIds.length === 0) return sendEmptyPublicList(res); }
    const activeBrandIds = !isAdminView ? await getActiveBrandIds(activeCategoryIds) : [];
    if (!isAdminView && activeBrandIds.length === 0) return sendEmptyPublicList(res);
    const adminQuery: QueryRecord = {};
    if (brandObjectId) adminQuery.brandId = brandObjectId;
    if (parentModelId) adminQuery.parentModelId = parentModelId;
    if (variantModelId) adminQuery.variantOfModelId = variantModelId;
    if (treeView && !parentModelId && !variantModelId) { adminQuery.variantOfModelId = { $in: [null] }; adminQuery.treeDepth = { $lte: MAX_MODEL_TREE_DEPTH }; }
    if (categoryId) Object.assign(adminQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: [categoryId] }).build());
    applyCatalogStatusFilter(adminQuery, rawStatus);
    const publicQuery: QueryRecord = { ...CATALOG_PUBLIC_VISIBILITY_QUERY };
    if (!isAdminView) { Object.assign(publicQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: activeCategoryIds }).build()); publicQuery.brandId = { $in: activeBrandIds }; }
    if (brandObjectId) publicQuery.brandId = brandObjectId;
    if (parentModelId) publicQuery.parentModelId = parentModelId;
    if (variantModelId) publicQuery.variantOfModelId = variantModelId;
    if (treeView && !parentModelId && !variantModelId) { publicQuery.variantOfModelId = { $in: [null] }; publicQuery.treeDepth = { $lte: MAX_MODEL_TREE_DEPTH }; }
    if (categoryObjectId) Object.assign(publicQuery, CategoryQueryBuilder.forPlural().withFilters({ categoryIds: [categoryObjectId] }).build());
    if (!isAdminView && brandObjectId) { const be = await checkBrandInCategories(brandObjectId, activeCategoryIds); if (!be) return sendEmptyPublicList(res); }
    return handlePaginatedContent(req, res, CatalogModel, {
        populate: isAdminView ? undefined : 'brandId categoryIds parentModelId variantOfModelId',
        adminQuery, publicQuery, searchFields: ['name', 'displayName', 'canonicalName', 'slug', 'aliases', 'synonyms'],
        queryParams: { ...(req.query as QueryRecord) }, transformResponse: includeVariants ? populateModelVariants : undefined,
    });
};

export const getModelById = async (req: Request, res: Response) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const model = await findModelByFilter({ _id: req.params.id, ...(isAdminView ? {} : { ...CATALOG_PUBLIC_VISIBILITY_QUERY }) });
        if (!model) return sendCatalogError(req, res, 'Model not found', 404);
        sendSuccessResponse(res, model);
    } catch (error) { sendCatalogError(req, res, error); }
};

export const getModelBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) return sendCatalogError(req, res, 'Model slug is required', 400);
        const slugAlias = slug.replace(/-/g, ' ');
        const model = await findModelBySlug(slug, { ...CATALOG_PUBLIC_VISIBILITY_QUERY }) || await findModelByFilter({ ...CATALOG_PUBLIC_VISIBILITY_QUERY, $or: [{ canonicalName: slugAlias }, { aliases: { $in: [slugAlias, slug] } }] });
        if (!model) return sendCatalogError(req, res, 'Model not found', 404);
        sendSuccessResponse(res, model);
    } catch (error) { sendCatalogError(req, res, error); }
};

export const createModel = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, CatalogModel, modelCreateSchema, {
        auditAction: 'MODEL_CREATE',
        preOp: async (payload) => {
            const brandId = toOptionalString(payload.brandId);
            const categoryIds = toStringArray(payload.categoryIds);
            if (!categoryIds || categoryIds.length === 0) {
                if (!brandId) throw new Error('brandId is required');
                const derivedId = await CatalogOrchestrator.resolvePrimaryCategoryIdFromBrand(brandId);
                payload.categoryIds = derivedId ? [derivedId.toString()] : [];
                if (!derivedId) payload.isActive = false;
            } else payload.categoryIds = categoryIds;
            if (!brandId) throw new Error('brandId is required');
            payload.brandId = brandId;
            const { ok, reason } = await validateBrandIsActive(brandId);
            if (!ok) throw new Error(reason || 'brandId must reference an active, non-deleted brand');
            if (!payload.categoryIds || (payload.categoryIds as unknown[]).length === 0) payload.isActive = false;
            payload.approvalStatus = deriveApprovalStatus({ approvalStatus: payload.approvalStatus, isActive: payload.isActive as boolean | undefined, fallback: CATALOG_APPROVAL_STATUS.APPROVED });
            const hierarchyPayload = await applyModelHierarchyPayload(payload);
            void logModelDuplicateCandidates(req, hierarchyPayload).catch((err) => logger.debug('[CatalogSearch] Duplicate candidate check skipped', { error: String(err) }));
            return hierarchyPayload;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }),
    });
};

export const updateModel = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, CatalogModel, modelUpdateSchema, {
        auditAction: 'MODEL_RENAME',
        preUpdate: async (_id, payload, existingModel) => {
            const brandId = toOptionalString(payload.brandId);
            const categoryIds = toStringArray(payload.categoryIds);
            if (payload.brandId !== undefined && !brandId) throw new Error('brandId must be a valid string');
            if (brandId) { payload.brandId = brandId; const { ok, reason } = await validateBrandIsActive(brandId); if (!ok) throw new Error(reason || 'brandId must reference an active, non-deleted brand'); }
            if (categoryIds && categoryIds.length > 0) payload.categoryIds = categoryIds;
            else if (payload.categoryIds !== undefined) { payload.categoryIds = []; payload.isActive = false; }
            else if ((existingModel as { categoryIds?: unknown[] }).categoryIds) payload.categoryIds = ((existingModel as { categoryIds?: unknown[] }).categoryIds || []).map(String);
            if (!payload.categoryIds || (payload.categoryIds as unknown[]).length === 0) payload.isActive = false;
            const te = existingModel as { approvalStatus?: unknown; isActive?: boolean };
            payload.approvalStatus = deriveApprovalStatus({ approvalStatus: payload.approvalStatus ?? te.approvalStatus, isActive: (payload.isActive ?? te.isActive) as boolean | undefined, fallback: CATALOG_APPROVAL_STATUS.APPROVED });
            const hierarchyPayload = await applyModelHierarchyPayload(payload, { existingModel });
            void logModelDuplicateCandidates(req, hierarchyPayload, { excludeId: _id }).catch((err) => logger.debug('[CatalogSearch] Duplicate check skipped', { error: String(err) }));
            return hierarchyPayload;
        },
        updateOp: async (id, data) => {
            const result = await updateModelHierarchyTransactionally(id, data);
            logger.info('[CatalogHierarchy] Model hierarchy mutation committed', { modelId: id, durationMs: result.metrics.durationMs, descendantScanCount: result.metrics.descendantScanCount, cascadeUpdateCount: result.metrics.cascadeUpdateCount });
            return result.item;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }),
    });
};

export const toggleModelStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, CatalogModel, {
        auditAction: 'TOGGLE_MODEL_STATUS',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }),
    });
};

export const deleteModel = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, CatalogModel, checkModelDependencies, {
        auditAction: 'MODEL_DELETE',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }),
    });
};

export const approveModel = (req: Request, res: Response) => handleCatalogReview(req, res, CatalogModel, 'APPROVE', undefined, { auditAction: 'APPROVE_MODEL', postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }) });

export const rejectModel = (req: Request, res: Response) => handleCatalogReview(req, res, CatalogModel, 'REJECT', rejectionSchema, { auditAction: 'REJECT_MODEL', postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }) });
