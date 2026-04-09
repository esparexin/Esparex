/**
 * Catalog Reference Controller
 * Handles service types and screen sizes (reference data)
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import ServiceType from '../../models/ServiceType';
import ScreenSize from '../../models/ScreenSize';
import Ad from '../../models/Ad';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import {
    asModel,
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
import { IServiceType } from '../../models/ServiceType';
import { IScreenSize } from '../../models/ScreenSize';

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
            const cat = await Category.findOne({ slug: categoryId });
            if (cat) categoryObjectId = cat._id.toString();
        }
    }

    const adminQuery: QueryRecord = CategoryQueryBuilder.forPlural().withFilters({ categoryId }).build();
    const publicQuery: QueryRecord = { 
        isActive: true,
        ...CategoryQueryBuilder.forPlural().withFilters({ categoryId: categoryObjectId }).build()
    };

    return handlePaginatedContent(req, res, ServiceType as any, {
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
        const serviceType = await ServiceType.findById(req.params.id).populate('categoryIds');
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
    return handleCatalogCreate(req, res, asModel<IServiceType>(ServiceType), serviceTypeCreateSchema, {
        auditAction: 'SERVICE_TYPE_CREATE',
        preOp: async (payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            return payload;
        }
    });
};

/**
 * Update existing service type
 */
export const updateServiceType = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, asModel<IServiceType>(ServiceType), serviceTypeUpdateSchema, {
        auditAction: 'SERVICE_TYPE_UPDATE',
        preUpdate: async (id, payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;
            return payload;
        }
    });
};

/**
 * Toggle service type active status
 */
export const toggleServiceTypeStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, asModel<IServiceType>(ServiceType) as any, { 
        auditAction: 'TOGGLE_SERVICE_TYPE_STATUS' 
    });
};

/**
 * Delete service type (soft delete with dependency check)
 */
export const deleteServiceType = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, asModel<IServiceType>(ServiceType) as any, async (id) => {
        const item = await ServiceType.findById(id);
        if (!item) return { count: 0, details: {} };

        const inUseCount = await Ad.countDocuments({
            status: AD_STATUS.LIVE,
            $or: [
                { serviceTypeIds: item._id },
                { serviceTypes: item.name }
            ]
        });
        return {
            count: inUseCount,
            details: { services: inUseCount }
        };
    }, { auditAction: 'SERVICE_TYPE_DELETE' });
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
            const cat = await Category.findOne({ slug: categoryId as string, ...ACTIVE_CATEGORY_QUERY });
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
    const activeBrands = !isAdminView
        ? await Brand.find({
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ],
            categoryId: { $in: activeCategoryIds }
        }).select('_id').lean()
        : [];
    const activeBrandIds = activeBrands.map((brand) => String(brand._id));

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

    return handlePaginatedContent(req, res, asModel(ScreenSize), {
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
        const size = await ScreenSize.findById(req.params.id).populate('categoryId');
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
    return handleCatalogCreate(req, res, asModel<IScreenSize>(ScreenSize), screenSizeCreateSchema, {
        auditAction: 'SCREEN_SIZE_CREATE',
        preOp: async (payload) => {
            if (!payload.name && payload.size) payload.name = `${payload.size} Screen Size`;
            const relation = await validateScreenSizeRelations({ categoryId: payload.categoryId, brandId: payload.brandId });
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');
            return payload;
        }
    });
};

/**
 * Update existing screen size
 */
export const updateScreenSize = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, asModel<IScreenSize>(ScreenSize), screenSizeUpdateSchema, {
        auditAction: 'SCREEN_SIZE_UPDATE',
        preUpdate: async (id, payload, existingSize) => {
            if (!payload.name && payload.size) payload.name = `${payload.size} Screen Size`;
            const nextCategoryId = payload.categoryId || String(existingSize.categoryId);
            const nextBrandId = payload.brandId ?? (existingSize.brandId ? String(existingSize.brandId) : undefined);
            const relation = await validateScreenSizeRelations({ categoryId: nextCategoryId, brandId: nextBrandId });
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');
            return payload;
        }
    });
};

/**
 * Delete screen size (soft delete)
 */
export const deleteScreenSize = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, asModel<IScreenSize>(ScreenSize) as any, undefined, { auditAction: 'SCREEN_SIZE_DELETE' });
};
