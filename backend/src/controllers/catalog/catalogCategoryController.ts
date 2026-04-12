/**
 * Catalog Category Controller
 * Handles all category-related operations
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import slugify from 'slugify';
import mongoose from 'mongoose';
import type { Model as MongooseModel } from 'mongoose';
import { getAdminConnection } from '../../config/db';
import { handlePaginatedContent } from '../../utils/contentHandler';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import ServiceType from '../../models/ServiceType';
import ScreenSize from '../../models/ScreenSize';
import { logAdminAction } from '../../utils/adminLogger';
import { AppError } from '../../utils/AppError';
import { sendSuccessResponse } from '../admin/adminBaseController';
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
    handleCatalogToggleStatus
} from './shared';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { getCache, setCache, CACHE_TTLS } from '../../utils/redisCache';
import logger from '../../utils/logger';

const CATALOG_COUNT_MAX_TIME_MS = 1500;
const CATALOG_COUNT_ESTIMATE_MAX_TIME_MS = 1000;

const countCatalogCollectionSafely = async (
    model: MongooseModel<any>,
    filter: Record<string, unknown>,
    hint?: Record<string, 1 | -1>
): Promise<number> => {
    const modelName = model.modelName || 'Unknown';
    const countOptions: Record<string, unknown> = {
        maxTimeMS: CATALOG_COUNT_MAX_TIME_MS,
        ...(hint ? { hint } : {})
    };

    try {
        return await model.collection.countDocuments(filter, countOptions);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isHintError = Boolean(hint) && /hint|index/i.test(message);

        if (isHintError) {
            try {
                return await model.collection.countDocuments(filter, {
                    maxTimeMS: CATALOG_COUNT_MAX_TIME_MS
                });
            } catch (retryError) {
                logger.warn('[CatalogCounts] countDocuments retry without hint failed; using estimate', {
                    model: modelName,
                    error: retryError instanceof Error ? retryError.message : String(retryError)
                });
            }
        } else {
            logger.warn('[CatalogCounts] countDocuments failed; using estimate', {
                model: modelName,
                error: message
            });
        }

        return model.collection.estimatedDocumentCount({
            maxTimeMS: CATALOG_COUNT_ESTIMATE_MAX_TIME_MS
        });
    }
};

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

        const nonDeletedFilter = { isDeleted: { $ne: true } };

        // Parallel count queries with bounded execution + safe fallback for drift/index issues.
        const [categories, brands, models, spareParts, serviceTypes, screenSizes] = await Promise.all([
            countCatalogCollectionSafely(Category, nonDeletedFilter, { isDeleted: 1 }),
            countCatalogCollectionSafely(Brand, nonDeletedFilter, { isDeleted: 1 }),
            countCatalogCollectionSafely(Model, nonDeletedFilter, { isDeleted: 1 }),
            countCatalogCollectionSafely(SparePart, nonDeletedFilter, { isDeleted: 1 }),
            countCatalogCollectionSafely(ServiceType, nonDeletedFilter, { isDeleted: 1 }),
            countCatalogCollectionSafely(ScreenSize, nonDeletedFilter, { isDeleted: 1 })
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
        const isAdminView = req.originalUrl.includes('/admin');
        const identifierParam = req.params.id;
        const identifier = Array.isArray(identifierParam) ? identifierParam[0] : identifierParam;
        if (!identifier) {
            return sendCatalogError(req, res, 'Category not found', 404);
        }
        const lookup = mongoose.Types.ObjectId.isValid(identifier)
            ? { _id: identifier }
            : { slug: identifier.toLowerCase() };

        const category = await Category.findOne({
            ...lookup,
            ...(isAdminView ? {} : ACTIVE_CATEGORY_QUERY),
        });
        if (!category) {
            return sendCatalogError(req, res, 'Category not found', 404);
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
            return sendCatalogError(req, res, 'Category not found', 404);
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
            return sendCatalogError(req, res, 'Admin access required', 403);
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
            return sendCatalogError(req, res, 'Category not found', 404);
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
        if (!hasAdminAccess(req)) return sendCatalogError(req, res, 'Admin access required', 403);
        const parsed = categoryCreateSchema.safeParse(req.body);
        if (!parsed.success) return sendValidationError(req, res, parsed.error);

        const payload = { ...parsed.data };
        payload.slug = slugify(payload.slug || payload.name, { lower: true, strict: true });
        
        if (!payload.slug) return sendCatalogError(req, res, 'Invalid category slug', 400);
        
        if (payload.parentId) {
            if (!(await Category.exists({ _id: payload.parentId }))) {
                return sendCatalogError(req, res, 'Invalid parent category', 400);
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
        if (!hasAdminAccess(req)) return sendCatalogError(req, res, 'Admin access required', 403);
        const categoryId = req.params.id;
        
        // Strip immutable/internal fields that admin frontends might send
        const PROTECTED_FIELDS = ['id', '_id', '__v', 'isDeleted', 'deletedAt', 'updatedAt', 'createdAt'];
        for (const field of PROTECTED_FIELDS) {
            delete req.body[field];
        }

        const oldCategory = await Category.findById(categoryId);
        if (!oldCategory) return sendCatalogError(req, res, 'Category not found', 404);

        const parsed = categoryUpdateSchema.safeParse(req.body);
        if (!parsed.success) return sendValidationError(req, res, parsed.error);

        const payload = { ...parsed.data };
        if (payload.name || payload.slug) {
            payload.slug = slugify(payload.slug || payload.name!, { lower: true, strict: true });
        }
        
        if (payload.slug !== undefined && payload.slug.length === 0) {
            return sendCatalogError(req, res, 'Invalid category slug', 400);
        }

        if (payload.parentId) {
            if (payload.parentId === categoryId) return sendCatalogError(req, res, 'Category cannot be its own parent', 400);
            if (!(await Category.exists({ _id: payload.parentId }))) return sendCatalogError(req, res, 'Invalid parent category', 400);
        }

        const payloadWithStatus = payload.isActive !== undefined
            ? { ...payload, status: payload.isActive ? CATALOG_STATUS.ACTIVE : CATALOG_STATUS.INACTIVE }
            : payload;

        const updatedCategory = await CatalogOrchestrator.updateCategory(categoryId as string, payloadWithStatus as any);
        if (!updatedCategory) return sendCatalogError(req, res, 'Category not found', 404);

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
        auditAction: 'TOGGLE_CATEGORY_STATUS',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
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
             return sendCatalogError(req, res, e.message, 403);
        } else if (e.message === 'Category not found') {
             return sendCatalogError(req, res, e.message, 404);
        } else {
             return sendCatalogError(req, res, e);
        }
    } finally {
        await session.endSession();
    }
};
