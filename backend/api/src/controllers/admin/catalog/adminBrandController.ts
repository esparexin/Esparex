import { Request, Response } from 'express';
import logger from '@esparex/core/utils/logger';
import { sendSuccessResponse } from '../../../utils/respond';
import { handlePaginatedContent } from '../../../utils/contentHandler';
import mongoose from 'mongoose';
import { CATALOG_APPROVAL_STATUS } from "@esparex/contracts";
import { findBrandByFilter, findCategoryBySlugForCatalog } from '@esparex/core/services/catalog/CatalogBrandModelService';
import BrandModel from '@esparex/core/models/Brand';
import CatalogOrchestrator from '@esparex/core/services/catalog/CatalogOrchestrator';
import { sendCatalogError, QueryRecord, ACTIVE_CATEGORY_QUERY, validateActiveCategories, handleCatalogCreate, handleCatalogUpdate, handleCatalogToggleStatus, handleCatalogReview, sendEmptyPublicList, applyCatalogStatusFilter, hasAdminAccess, CATALOG_PUBLIC_VISIBILITY_QUERY, deriveApprovalStatus } from './adminCatalogHelpers';
import { logAdminAction } from '../../../utils/adminLogger';
import { brandCreateSchema, brandUpdateSchema, rejectionSchema } from '@esparex/core/validators/catalog.validator';
import CategoryQueryBuilder from '@esparex/core/utils/CategoryQueryBuilder';
import { getCache } from '@esparex/core/utils/redisCache';
import { catalogCacheKey, applyCacheWriteThrough } from './adminCatalogHelpers';
import { AppError } from '@esparex/core/utils/AppError';

export const getBrands = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const categoryId = req.query.categoryId as string;
    let categoryObjectId: string | undefined = (categoryId && categoryId !== 'all') ? categoryId : undefined;
    if (!isAdminView && categoryId && categoryId !== 'all') {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await findCategoryBySlugForCatalog(categoryId, ACTIVE_CATEGORY_QUERY);
            if (cat) categoryObjectId = cat._id.toString();
            else logger.debug('[Catalog] Category not found by slug (getBrands)', { categorySlug: categoryId });
        }
    }
    if (!isAdminView && !categoryObjectId) return sendCatalogError(req, res, 'categoryId is required', 400);
    if (!isAdminView) {
        const cacheKey = catalogCacheKey.brands(categoryObjectId ?? 'all');
        const cached = await getCache<unknown>(cacheKey);
        if (cached) return res.json(cached);
        applyCacheWriteThrough(res, cacheKey);
    }
    if (!isAdminView && categoryObjectId) {
        const v = await validateActiveCategories([categoryObjectId]);
        if (!v.ok) { logger.debug('[Catalog] Category not active (getBrands)', { categoryId: categoryObjectId }); return sendEmptyPublicList(res); }
    }
    const queryParams: QueryRecord = { ...(req.query as QueryRecord) };
    delete queryParams.categoryId; delete queryParams.categoryIds; delete queryParams.status;
    const categoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    const adminCategoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: categoryObjectId ? [categoryObjectId] : [] }).build();
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    applyCatalogStatusFilter(adminCategoryFilter, rawStatus);
    return handlePaginatedContent(req, res, BrandModel, {
        searchFields: ['name', 'canonicalName', 'aliases'],
        publicQuery: { ...CATALOG_PUBLIC_VISIBILITY_QUERY, ...categoryFilter },
        adminQuery: adminCategoryFilter, queryParams,
    });
};

export const getBrandById = async (req: Request, res: Response) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const brand = await findBrandByFilter({ _id: req.params.id, ...(isAdminView ? {} : { ...CATALOG_PUBLIC_VISIBILITY_QUERY }) });
        if (!brand) return sendCatalogError(req, res, 'Brand not found', 404);
        sendSuccessResponse(res, brand);
    } catch (error) { sendCatalogError(req, res, error); }
};

export const getBrandBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) return sendCatalogError(req, res, 'Brand slug is required', 400);
        const brand = await findBrandByFilter({ ...CATALOG_PUBLIC_VISIBILITY_QUERY, $or: [{ slug }, { canonicalName: slug.replace(/-/g, ' ') }, { aliases: { $in: [slug.replace(/-/g, ' '), slug] } }] });
        if (!brand) return sendCatalogError(req, res, 'Brand not found', 404);
        sendSuccessResponse(res, brand);
    } catch (error) { sendCatalogError(req, res, error); }
};

export const createBrand = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, BrandModel, brandCreateSchema, {
        auditAction: 'BRAND_CREATE', slugifyName: true,
        preOp: async (payload) => {
            const categoryIds = Array.isArray(payload.categoryIds) ? (payload.categoryIds as string[]).map(String) : [];
            payload.categoryIds = categoryIds;
            if (categoryIds.length === 0) payload.isActive = false;
            payload.approvalStatus = deriveApprovalStatus({ approvalStatus: payload.approvalStatus, isActive: payload.isActive as boolean | undefined, fallback: CATALOG_APPROVAL_STATUS.APPROVED });
            const catVal = await validateActiveCategories(categoryIds);
            if (!catVal.ok) throw new Error(`Invalid or inactive categories: ${catVal.invalidCategoryIds.join(', ')}`);
            return payload;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }),
    });
};

export const updateBrand = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, BrandModel, brandUpdateSchema, {
        auditAction: 'BRAND_RENAME',
        preUpdate: async (_id, payload, oldBrand) => {
            const typedOld = oldBrand as { categoryIds?: unknown[]; approvalStatus?: unknown; isActive?: boolean };
            const nextCategoryIds = payload.categoryIds ? (payload.categoryIds as string[]).map(String) : (typedOld.categoryIds || []).map(String);
            payload.categoryIds = nextCategoryIds;
            if (nextCategoryIds.length === 0) payload.isActive = false;
            payload.approvalStatus = deriveApprovalStatus({ approvalStatus: payload.approvalStatus ?? typedOld.approvalStatus, isActive: (payload.isActive ?? typedOld.isActive) as boolean | undefined, fallback: CATALOG_APPROVAL_STATUS.APPROVED });
            const catVal = await validateActiveCategories(nextCategoryIds);
            if (!catVal.ok) throw new Error(`Invalid or inactive categories: ${catVal.invalidCategoryIds.join(', ')}`);
            return payload;
        },
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }),
    });
};

export const toggleBrandStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, BrandModel, {
        auditAction: 'TOGGLE_BRAND_STATUS',
        postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }),
    });
};

export const deleteBrand = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) return res.status(403).json({ success: false, error: 'Admin access required', path: req.originalUrl || req.path, status: 403 });
        const id = String(req.params.id);
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Invalid Brand ID format', path: req.originalUrl || req.path, status: 400 });

        const result = await CatalogOrchestrator.deleteBrandOrchestrated(id);

        if (!result.alreadyDeleted) {
            void logAdminAction(req, 'BRAND_DELETE', 'Brand', new mongoose.Types.ObjectId(id));
        }

        return res.status(200).json({
            success: true,
            message: 'Brand and dependent models and spare parts soft-deleted successfully',
            data: result
        });
    } catch (error) {
        if (error instanceof AppError && error.code === 'DEPENDENCIES_EXIST') {
            return res.status(409).json({
                success: false,
                error: error.message,
                status: 409,
                details: error.details
            });
        }
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
            path: req.originalUrl || req.path,
            status: 500
        });
    }
};

export const approveBrand = (req: Request, res: Response) => handleCatalogReview(req, res, BrandModel, 'APPROVE', undefined, { auditAction: 'APPROVE_BRAND', postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }) });

export const rejectBrand = (req: Request, res: Response) => handleCatalogReview(req, res, BrandModel, 'REJECT', rejectionSchema, { auditAction: 'REJECT_BRAND', postOp: (item: any) => void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: item.categoryIds || (item.categoryId ? [item.categoryId] : []), brandIds: item.brandId ? [item.brandId] : [] }) });
