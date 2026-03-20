/**
 * Catalog Category Controller
 * Handles all category-related operations
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import slugify from 'slugify';
import { z, ZodError } from 'zod';
import mongoose from 'mongoose';
import { getAdminConnection } from '../../config/db';
import { handlePaginatedContent } from '../../utils/contentHandler';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import ServiceType from '../../models/ServiceType';
import ScreenSize from '../../models/ScreenSize';
import Ad from '../../models/Ad';
import { logAdminAction } from '../../utils/adminLogger';
import { sendSuccessResponse } from '../admin/adminBaseController';
// import { categorySpecificFilters } from '../../constants/categorySchema'; // Deprecated - migrating to DB
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
import { clearCategoryCanonicalCache } from '../../utils/categoryCanonical';
import { hasAdminAccess, sendCatalogError, QueryRecord, ACTIVE_CATEGORY_QUERY } from './shared';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { getCache, setCache, CACHE_TTLS } from '../../utils/redisCache';

import { 
    categoryCreateSchema, 
    categoryUpdateSchema, 
    categorySchemaUpdateBodySchema 
} from '../../validators/catalog.validator';

const sendValidationError = (req: Request, res: Response, error: ZodError) => {
    sendContractErrorResponse(req, res, 400, 'Validation failed', {
        details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    });
};

/**
 * Get all categories (public paginated)
 */
export const getCategories = async (req: Request, res: Response) => {
    const queryParams: QueryRecord = { ...(req.query as QueryRecord) };
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    if (rawStatus === CATALOG_STATUS.ACTIVE || rawStatus === CATALOG_STATUS.INACTIVE) {
        queryParams.isActive = rawStatus === CATALOG_STATUS.ACTIVE;
        delete queryParams.status;
    }

    return handlePaginatedContent(req, res, Category, {
        searchFields: ['name', 'slug'],
        defaultSort: { name: 1 },
        publicQuery: { ...ACTIVE_CATEGORY_QUERY },
        queryParams
    });
};

/**
 * Get counts of all catalog entities
 */
export const getCategoryCounts = async (req: Request, res: Response) => {
    try {
        const CACHE_KEY = 'catalog:counts:overview';
        const cached = await getCache<Record<string, number>>(CACHE_KEY);
        if (cached) {
            sendSuccessResponse(res, cached);
            return;
        }

        // Parallel count queries replacing the broken $facet union approach
        const [categories, brands, models, spareParts, serviceTypes, screenSizes] = await Promise.all([
            Category.countDocuments({ isDeleted: { $ne: true } }),
            Brand.countDocuments({ isDeleted: { $ne: true } }),
            Model.countDocuments({ isDeleted: { $ne: true } }),
            SparePart.countDocuments({ isDeleted: { $ne: true } }),
            ServiceType.countDocuments({ isDeleted: { $ne: true } }),
            ScreenSize.countDocuments()
        ]);

        const counts = {
            categories,
            brands,
            models,
            spareParts,
            serviceTypes,
            screenSizes
        };

        // Cache for 1 hour — catalog counts change infrequently
        await setCache(CACHE_KEY, counts, CACHE_TTLS.CATEGORIES);
        sendSuccessResponse(res, counts);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            sendContractErrorResponse(req, res, 404, 'Category not found');
            return;
        }
        sendSuccessResponse(res, category);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Get category schema with merged filters (hardcoded + database)
 */
export const getCategorySchema = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) {
            sendContractErrorResponse(req, res, 404, 'Category not found');
            return;
        }

        const mergedFilters = category.filters || [];

        sendSuccessResponse(res, {
            categoryId: category.id,
            categoryName: category.name,
            filters: mergedFilters
        });
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Update category schema (filters)
 */
export const updateCategorySchema = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) {
            sendContractErrorResponse(req, res, 403, 'Admin access required');
            return;
        }

        const { id } = req.params;
        const parsed = categorySchemaUpdateBodySchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const { filters } = parsed.data;

        const category = await Category.findByIdAndUpdate(
            id,
            { filters },
            { new: true, runValidators: true }
        );

        if (!category) {
            sendContractErrorResponse(req, res, 404, 'Category not found');
            return;
        }

        await CatalogOrchestrator.invalidateCatalogCache();
        clearCategoryCanonicalCache();
        await logAdminAction(req, 'UPDATE_CATEGORY_SCHEMA', 'Category', category._id, { filters });

        sendSuccessResponse(res, category, 'Category schema updated successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new category
 */
export const createCategory = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const parsed = categoryCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }

        const payload = { ...parsed.data };
        if (payload.slug) {
            payload.slug = slugify(payload.slug, { lower: true, strict: true });
        }
        if (!payload.slug) {
            payload.slug = slugify(payload.name, { lower: true, strict: true });
        }
        if (!payload.slug) {
            sendContractErrorResponse(req, res, 400, 'Invalid category slug');
            return;
        }
        if (payload.parentId) {
            const parentExists = await Category.exists({ _id: payload.parentId });
            if (!parentExists) {
                sendContractErrorResponse(req, res, 400, 'Invalid parent category');
                return;
            }
        }

        const category = await CatalogOrchestrator.createCategory({
            ...payload,
            status: payload.isActive === false ? CATALOG_STATUS.INACTIVE : CATALOG_STATUS.ACTIVE
        } as any);
        clearCategoryCanonicalCache();
        sendSuccessResponse(res, category, 'Category created successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Update existing category
 */
export const updateCategory = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const categoryId = req.params.id;
        const oldCategory = await Category.findById(categoryId);
        if (!oldCategory) { sendContractErrorResponse(req, res, 404, 'Category not found'); return; }

        const parsed = categoryUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const payload = { ...parsed.data };
        if (payload.slug) {
            payload.slug = slugify(payload.slug, { lower: true, strict: true });
        }
        if (!payload.slug && payload.name) {
            payload.slug = slugify(payload.name, { lower: true, strict: true });
        }
        if (payload.slug !== undefined && payload.slug.length === 0) {
            sendContractErrorResponse(req, res, 400, 'Invalid category slug');
            return;
        }
        if (payload.parentId) {
            if (payload.parentId === categoryId) {
                sendContractErrorResponse(req, res, 400, 'Category cannot be its own parent');
                return;
            }
            const parentExists = await Category.exists({ _id: payload.parentId });
            if (!parentExists) {
                sendContractErrorResponse(req, res, 400, 'Invalid parent category');
                return;
            }
        }

        const payloadWithStatus = payload.isActive !== undefined
            ? { ...payload, status: payload.isActive ? CATALOG_STATUS.ACTIVE : CATALOG_STATUS.INACTIVE }
            : payload;
        const updatedCategory = await CatalogOrchestrator.updateCategory(categoryId as string, payloadWithStatus as any);
        if (!updatedCategory) { sendContractErrorResponse(req, res, 404, 'Category not found'); return; }

        clearCategoryCanonicalCache();

        // SafeRename: Removed string field updates logic (Ad.category, Business.category, Service.category) 
        // as these fields are deprecated. Only ID references remain.

        // AUDIT LOG
        logAdminAction(req, 'CATEGORY_RENAME', 'Category', updatedCategory._id, {
            before: { name: oldCategory.name, slug: oldCategory.slug },
            after: { name: updatedCategory.name, slug: updatedCategory.slug },
            impacted: { ads: 0, businesses: 0, services: 0 }
        });

        sendSuccessResponse(res, updatedCategory, 'Category updated successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Toggle category active status
 */
export const toggleCategoryStatus = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const category = await Category.findById(req.params.id);
        if (!category) {
            sendContractErrorResponse(req, res, 404, 'Category not found');
            return;
        }
        category.isActive = !category.isActive;
        category.status = category.isActive ? CATALOG_STATUS.ACTIVE : CATALOG_STATUS.INACTIVE;
        
        // Initialize listingType if missing to avoid downstream capability check failures
        if (!category.listingType || category.listingType.length === 0) {
            category.listingType = [];
        }

        await category.save();
        await CatalogOrchestrator.invalidateCatalogCache();
        clearCategoryCanonicalCache();
        sendSuccessResponse(res, category, 'Category status toggled');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Delete category (soft delete with dependency check)
 */
export const deleteCategory = async (req: Request, res: Response) => {
    const session = await getAdminConnection().startSession();
    session.startTransaction();

    try {
        if (!hasAdminAccess(req)) { 
            throw new Error('Admin access required'); 
        }
        
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId).session(session);
        if (!category) {
            throw new Error('Category not found');
        }

        category.isDeleted = true;
        category.isActive = false;
        category.deletedAt = new Date();
        await category.save({ session });

        // centralize cascade logic
        await CatalogOrchestrator.cascadeCategoryDelete(String(category._id), session);

        await session.commitTransaction();
        clearCategoryCanonicalCache();
        
        sendSuccessResponse(res, null, 'Category and all dependent brands/models soft-deleted successfully');
    } catch (e: any) {
        await session.abortTransaction();
        if (e.message === 'Admin access required') {
             sendContractErrorResponse(req, res, 403, e.message);
        } else if (e.message === 'Category not found') {
             sendContractErrorResponse(req, res, 404, e.message);
        } else {
             sendContractErrorResponse(req, res, 500, e.message);
        }
    } finally {
        await session.endSession();
    }
};
