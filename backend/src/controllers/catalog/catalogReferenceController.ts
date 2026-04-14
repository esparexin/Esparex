/**
 * Catalog Reference Controller
 * Handles service types and screen sizes (reference data)
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
import {
    sendCatalogError,
    QueryRecord,
    validateActiveCategories,
    getActiveCategoryIds,
    handleCatalogCreate,
    handleCatalogUpdate,
    handleCatalogToggleStatus,
    handleCatalogDelete,
    sendEmptyPublicList,
    sendSuccessResponse,
    handlePaginatedContent
} from './shared';
import { validateScreenSizeRelations } from '../../services/catalog/CatalogValidationService';
import {
    screenSizeCreateSchema,
    screenSizeUpdateSchema,
    serviceTypeCreateSchema,
    serviceTypeUpdateSchema
} from '../../validators/catalog.validator';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';
import {
    ServiceTypeModel,
    ScreenSizeModel,
    findCategoryBySlug,
    findActiveCategoryBySlug,
    findServiceTypeById,
    checkServiceTypeDependencies,
    findScreenSizeById,
    getActiveBrandsForScreenSizes,
} from '../../services/catalog/CatalogReferenceService';

// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// Reference data CRUD now delegated to shared.ts generic handlers.

/* ==========================================================
   SERVICE TYPES
   ========================================================== */

/**
 * Get all service types (with optional category filter)
 */
export const getServiceTypes = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const categoryId = req.query.categoryId as string;

    let categoryObjectId: string | undefined = categoryId;
    if (!isAdminView && categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await findCategoryBySlug(categoryId);
            if (cat) categoryObjectId = cat._id.toString();
        }
    }

    const adminQuery: QueryRecord = CategoryQueryBuilder.forPlural().withFilters({ categoryId }).build();
    const publicQuery: QueryRecord = { 
        isActive: true,
        ...CategoryQueryBuilder.forPlural().withFilters({ categoryId: categoryObjectId }).build()
    };

    return handlePaginatedContent(req, res, ServiceTypeModel as any, {
        populate: isAdminView ? undefined : 'categoryIds',
        adminQuery,
        publicQuery
    });
};

/**
 * Get single service type by ID
 */
export const getServiceTypeById = async (req: Request, res: Response) => {
    try {
        const serviceType = await findServiceTypeById(req.params.id as string);
        if (!serviceType) return sendCatalogError(req, res, 'Service type not found', 404);
        sendSuccessResponse(res, serviceType);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new service type
 */
export const createServiceType = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, ServiceTypeModel as any, serviceTypeCreateSchema, {
        auditAction: 'SERVICE_TYPE_CREATE',
        preOp: async (payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Update existing service type
 */
export const updateServiceType = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, ServiceTypeModel as any, serviceTypeUpdateSchema, {
        auditAction: 'SERVICE_TYPE_UPDATE',
        preUpdate: async (id, payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Toggle service type active status
 */
export const toggleServiceTypeStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, ServiceTypeModel as any, {
        auditAction: 'TOGGLE_SERVICE_TYPE_STATUS',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Delete service type (soft delete with dependency check)
 */
export const deleteServiceType = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, ServiceTypeModel as any, checkServiceTypeDependencies, {
        auditAction: 'SERVICE_TYPE_DELETE',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/* ==========================================================
   SCREEN SIZES
   ========================================================== */

/**
 * Get all screen sizes (with optional category filter)
 */
export const getScreenSizes = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { categoryId } = req.query;

    let categoryObjectId: string | mongoose.Types.ObjectId | undefined = categoryId as string | undefined;
    if (!isAdminView && categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId as string)) {
            const cat = await findActiveCategoryBySlug(categoryId as string);
            if (cat) categoryObjectId = cat._id;
        }
    }
    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await validateActiveCategories([String(categoryObjectId)]);
        if (!activeCategoryValidation.ok) {
            return sendEmptyPublicList(res);
        }
    }

    const activeCategoryIds = !isAdminView
        ? (categoryObjectId ? [String(categoryObjectId)] : await getActiveCategoryIds())
        : [];
    if (!isAdminView && activeCategoryIds.length === 0) {
        return sendEmptyPublicList(res);
    }
    const activeBrandDocs = !isAdminView
        ? await getActiveBrandsForScreenSizes(activeCategoryIds)
        : [];
    const activeBrandIds = activeBrandDocs.map((brand) => String(brand._id));

    const adminQuery: QueryRecord = CategoryQueryBuilder.forSingular().withFilters({ categoryId: categoryId as string }).build();

    const publicQuery: QueryRecord = { 
        isActive: true,
        ...CategoryQueryBuilder.forSingular().withFilters({ 
            categoryId: categoryObjectId ? String(categoryObjectId) : undefined, 
            categoryIds: activeCategoryIds 
        }).build(),
        $or: [
            { brandId: { $exists: false } },
            { brandId: null },
            { brandId: { $in: activeBrandIds } }
        ]
    };

    return handlePaginatedContent(req, res, ScreenSizeModel, {
        adminQuery,
        publicQuery,
        searchFields: ['name', 'size']
    });
};

/**
 * Get single screen size by ID
 */
export const getScreenSizeById = async (req: Request, res: Response) => {
    try {
        const size = await findScreenSizeById(req.params.id as string);
        if (!size) return sendCatalogError(req, res, 'Screen size not found', 404);
        sendSuccessResponse(res, size);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new screen size
 */
export const createScreenSize = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, ScreenSizeModel as any, screenSizeCreateSchema, {
        auditAction: 'SCREEN_SIZE_CREATE',
        preOp: async (payload) => {
            if (!payload.name && payload.size) payload.name = `${payload.size} Screen Size`;
            const relation = await validateScreenSizeRelations({ categoryId: payload.categoryId, brandId: payload.brandId });
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Update existing screen size
 */
export const updateScreenSize = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, ScreenSizeModel as any, screenSizeUpdateSchema, {
        auditAction: 'SCREEN_SIZE_UPDATE',
        preUpdate: async (id, payload, existingSize) => {
            if (!payload.name && payload.size) payload.name = `${payload.size} Screen Size`;
            const nextCategoryId = payload.categoryId || String((existingSize as any).categoryId);
            const nextBrandId = payload.brandId ?? ((existingSize as any).brandId ? String((existingSize as any).brandId) : undefined);
            const relation = await validateScreenSizeRelations({ categoryId: nextCategoryId, brandId: nextBrandId });
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Toggle screen size active status
 */
export const toggleScreenSizeStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, ScreenSizeModel as any, {
        auditAction: 'TOGGLE_SCREEN_SIZE_STATUS',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Delete screen size (soft delete)
 */
export const deleteScreenSize = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, ScreenSizeModel as any, undefined, {
        auditAction: 'SCREEN_SIZE_DELETE',
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};
