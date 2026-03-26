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
import { AppError } from '../../utils/AppError';
import { 
    sendAdminError,
    sendSuccessResponse 
} from '../admin/adminBaseController';
// import { categorySpecificFilters } from '../../constants/categorySchema'; // Deprecated - migrating to DB
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
import { clearCategoryCanonicalCache } from '../../utils/categoryCanonical';
import {
    categoryCreateSchema,
    categoryUpdateSchema,
    categorySchemaUpdateBodySchema
} from '../../validators/catalog.validator';
import {
    hasAdminAccess,
    sendCatalogError,
    asModel,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    sendValidationError,
    sendEmptyPublicList,
    handleCatalogToggleStatus
} from './shared';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { getCache, setCache, CACHE_TTLS } from '../../utils/redisCache';

// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// Category operations delegated to shared.ts or CatalogOrchestrator.

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
            return sendAdminError(req, res, 'Category not found', 404);
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
            return sendAdminError(req, res, 'Category not found', 404);
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
            return sendAdminError(req, res, 'Admin access required', 403);
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
            return sendAdminError(req, res, 'Category not found', 404);
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
        if (!hasAdminAccess(req)) return sendAdminError(req, res, 'Admin access required', 403);
        const parsed = categoryCreateSchema.safeParse(req.body);
        if (!parsed.success) return sendValidationError(req, res, parsed.error);

        const payload = { ...parsed.data };
        payload.slug = slugify(payload.slug || payload.name, { lower: true, strict: true });
        
        if (!payload.slug) return sendAdminError(req, res, 'Invalid category slug', 400);
        
        if (payload.parentId) {
            if (!(await Category.exists({ _id: payload.parentId }))) {
                return sendAdminError(req, res, 'Invalid parent category', 400);
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
        if (!hasAdminAccess(req)) return sendAdminError(req, res, 'Admin access required', 403);
        const categoryId = req.params.id;
        const oldCategory = await Category.findById(categoryId);
        if (!oldCategory) return sendAdminError(req, res, 'Category not found', 404);

        const parsed = categoryUpdateSchema.safeParse(req.body);
        if (!parsed.success) return sendValidationError(req, res, parsed.error);

        const payload = { ...parsed.data };
        if (payload.name || payload.slug) {
            payload.slug = slugify(payload.slug || payload.name!, { lower: true, strict: true });
        }
        
        if (payload.slug !== undefined && payload.slug.length === 0) {
            return sendAdminError(req, res, 'Invalid category slug', 400);
        }

        if (payload.parentId) {
            if (payload.parentId === categoryId) return sendAdminError(req, res, 'Category cannot be its own parent', 400);
            if (!(await Category.exists({ _id: payload.parentId }))) return sendAdminError(req, res, 'Invalid parent category', 400);
        }

        const payloadWithStatus = payload.isActive !== undefined
            ? { ...payload, status: payload.isActive ? CATALOG_STATUS.ACTIVE : CATALOG_STATUS.INACTIVE }
            : payload;

        const updatedCategory = await CatalogOrchestrator.updateCategory(categoryId as string, payloadWithStatus as any);
        if (!updatedCategory) return sendAdminError(req, res, 'Category not found', 404);

        clearCategoryCanonicalCache();

        logAdminAction(req, 'CATEGORY_RENAME', 'Category', updatedCategory._id, {
            before: { name: oldCategory.name, slug: oldCategory.slug },
            after: { name: updatedCategory.name, slug: updatedCategory.slug }
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
    return handleCatalogToggleStatus(req, res, asModel(Category) as any, { 
        auditAction: 'TOGGLE_CATEGORY_STATUS' 
    });
};

/**
 * Delete category (soft delete with dependency check)
 */
export const deleteCategory = async (req: Request, res: Response) => {
    const session = await getAdminConnection().startSession();
    session.startTransaction();

    try {
        if (!hasAdminAccess(req)) { 
            throw new AppError('Admin access required', 403, 'FORBIDDEN');
        }
        
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId).session(session);
        if (!category) {
            throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
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
             return sendAdminError(req, res, e.message, 403);
        } else if (e.message === 'Category not found') {
             return sendAdminError(req, res, e.message, 404);
        } else {
             return sendAdminError(req, res, e);
        }
    } finally {
        await session.endSession();
    }
};
