/**
 * Catalog Category Controller
 * Handles all category-related operations
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import slugify from 'slugify';
import logger from '@esparex/core/utils/logger';
import { getUserConnection } from '@esparex/core/config/db';
import { handlePaginatedContent } from "../../../utils/contentHandler";
import {
    CategoryModel,
    getCatalogEntityCounts,
    findCategoryById,
    categoryParentExists,
    updateCategorySchemaById,
    findCategoryByIdWithSession,
    softDeleteCategoryById,
} from '@esparex/core/services/catalog/CatalogCategoryService';
import { logAdminAction } from '../../../utils/adminLogger';
import { AppError } from '@esparex/core/utils/AppError';
import { sendSuccessResponse } from "../../../utils/respond";
// import { categorySpecificFilters } from '../../constants/categorySchema'; // Deprecated - migrating to DB
import CatalogOrchestrator from '@esparex/core/services/catalog/CatalogOrchestrator';
import { clearCategoryCanonicalCache } from '@esparex/core/utils/categoryCanonical';
// Note: constants/categorySchema was removed; category filters are now DB-stored.
import {
    categoryCreateSchema,
    categoryUpdateSchema,
    categorySchemaUpdateBodySchema
} from '@esparex/core/validators/catalog.validator';
import {
    hasAdminAccess,
    sendCatalogError,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    handleCatalogToggleStatus,
    applyCatalogStatusFilter,
    deriveApprovalStatus,
    sendValidationError
} from './shared';
import { CATALOG_APPROVAL_STATUS } from '@esparex/shared';
import { getCache, setCache, CACHE_TTLS } from '@esparex/core/utils/redisCache';

// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// Category operations delegated to shared.ts or CatalogOrchestrator.

/**
 * Get all categories (public paginated)
 */
export const getCategories = async (req: Request, res: Response) => {
    const queryParams: QueryRecord = { ...(req.query as QueryRecord) };
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    delete queryParams.status;
    const adminQuery: QueryRecord = {};
    applyCatalogStatusFilter(adminQuery, rawStatus);

    return handlePaginatedContent(req, res, CategoryModel, {
        searchFields: ['name', 'slug'],
        defaultSort: { name: 1 },
        publicQuery: { ...ACTIVE_CATEGORY_QUERY },
        adminQuery,
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

        const counts = await getCatalogEntityCounts();

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
        const category = await findCategoryById(req.params.id as string, isAdminView ? {} : ACTIVE_CATEGORY_QUERY);
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
        const id = req.params.id as string;
        const isAdminView = req.originalUrl.includes('/admin');
        const category = await findCategoryById(id, isAdminView ? {} : ACTIVE_CATEGORY_QUERY);
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

        const id = req.params.id as string;
        const parsed = categorySchemaUpdateBodySchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const { filters } = parsed.data;

        const category = await updateCategorySchemaById(id, filters);

        if (!category) {
            return sendCatalogError(req, res, 'Category not found', 404);
        }

        await CatalogOrchestrator.invalidateCatalogCache({ categoryIds: [id] });
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
            if (!(await categoryParentExists(payload.parentId))) {
                return sendCatalogError(req, res, 'Invalid parent category', 400);
            }
        }

        const category = await CatalogOrchestrator.createCategory({
            ...payload,
            approvalStatus: deriveApprovalStatus({
                approvalStatus: (payload as Record<string, unknown>).approvalStatus,
                isActive: payload.isActive as boolean | undefined,
                fallback: CATALOG_APPROVAL_STATUS.APPROVED,
            }),
        } as Partial<import('@esparex/core/models/Category').ICategory>);

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
        const categoryId = req.params.id as string;
        
        // Strip immutable/internal fields that admin frontends might send
        const PROTECTED_FIELDS = ['id', '_id', '__v', 'isDeleted', 'deletedAt', 'updatedAt', 'createdAt'];
        const mutableBody = req.body as Record<string, unknown>;
        for (const field of PROTECTED_FIELDS) {
            delete mutableBody[field];
        }

        const oldCategory = await findCategoryById(categoryId);
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
            if (!(await categoryParentExists(payload.parentId))) return sendCatalogError(req, res, 'Invalid parent category', 400);
        }

        const payloadWithStatus = payload.isActive !== undefined
            ? {
                ...payload,
                approvalStatus: deriveApprovalStatus({
                    approvalStatus: (payload as Record<string, unknown>).approvalStatus,
                    isActive: payload.isActive as boolean | undefined,
                    fallback: CATALOG_APPROVAL_STATUS.APPROVED,
                }),
            }
            : payload;

        const updatedCategory = await CatalogOrchestrator.updateCategory(categoryId, payloadWithStatus as Partial<import('@esparex/core/models/Category').ICategory>);
        if (!updatedCategory) return sendCatalogError(req, res, 'Category not found', 404);

        clearCategoryCanonicalCache();

        void logAdminAction(req, 'CATEGORY_RENAME', 'Category', updatedCategory._id, {
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
    return handleCatalogToggleStatus(req, res, CategoryModel, {
        auditAction: 'TOGGLE_CATEGORY_STATUS',
        postOp: (item) => {
            clearCategoryCanonicalCache();
            void CatalogOrchestrator.invalidateCatalogCache({ categoryIds: [item._id] });
        }
    });
};

/**
 * Delete category (soft delete with dependency check)
 */
export const deleteCategory = async (req: Request, res: Response) => {
    if (!hasAdminAccess(req)) {
        return sendCatalogError(req, res, 'Admin access required', 403);
    }

    const categoryId = req.params.id as string;

    try {
        await CatalogOrchestrator.deleteCategoryOrchestrated(categoryId);
        clearCategoryCanonicalCache();
        sendSuccessResponse(res, null, 'Category and all dependent brands/models soft-deleted successfully');
    } catch (e: unknown) {
        const err = e instanceof AppError ? e : null;
        if (err?.code === 'FORBIDDEN') {
            return sendCatalogError(req, res, err.message, 403);
        } else if (err?.code === 'CATEGORY_NOT_FOUND') {
            return sendCatalogError(req, res, err.message, 404);
        }
        return sendCatalogError(req, res, e);
    }
};

