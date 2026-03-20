/**
 * Catalog Reference Controller
 * Handles service types and screen sizes (reference data)
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z, ZodError } from 'zod';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import ServiceType from '../../models/ServiceType';
import ScreenSize from '../../models/ScreenSize';
import Ad from '../../models/Ad';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { handlePaginatedContent } from '../../utils/contentHandler';
import { respond } from '../../utils/respond';
import { sendSuccessResponse } from '../admin/adminBaseController';
import { escapeRegExp } from '../../utils/stringUtils';
import {
    asModel,
    hasAdminAccess,
    sendCatalogError,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    validateActiveCategories,
    getActiveCategoryIds
} from './shared';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { validateScreenSizeRelations } from '../../services/catalog/CatalogValidationService';
import {
    screenSizeCreateSchema,
    screenSizeUpdateSchema,
    serviceTypeCreateSchema,
    serviceTypeUpdateSchema
} from '../../validators/catalog.validator';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';

// Local schemas replaced by centralized catalog.validator.ts

const sendValidationError = (req: Request, res: Response, error: ZodError) => {
    sendContractErrorResponse(req, res, 400, 'Validation failed', {
        details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    });
};

const sendEmptyPublicList = (res: Response) => res.status(200).json(respond({
    success: true,
    data: {
        items: [],
        total: 0
    }
}));

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

    return handlePaginatedContent(req, res, ServiceType, {
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
        if (!serviceType) { sendContractErrorResponse(req, res, 404, 'Service type not found'); return; }
        sendSuccessResponse(res, serviceType);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new service type
 */
export const createServiceType = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }

        let { name, categoryIds, categoryId } = req.body;
        
        // Backward compatibility mapping
        if (!categoryIds && categoryId) {
            categoryIds = [categoryId];
        }

        if (!name || (!categoryIds && !categoryId)) {
            sendContractErrorResponse(req, res, 400, 'Name and Categories are required');
            return;
        }

        // DUPLICATE CHECK: names should be unique within a category
        const existing = await ServiceType.findOne({
            name: { $regex: new RegExp(`^${escapeRegExp(name)}$`, 'i') },
            ...CategoryQueryBuilder.forPlural().withFilters({ categoryIds }).build(),
            isDeleted: false
        });

        if (existing) {
            sendContractErrorResponse(req, res, 409, 'Service type already exists in one of the selected categories');
            return;
        }

        const serviceType = await ServiceType.create({
            ...req.body,
            categoryIds
        });
        sendSuccessResponse(res, serviceType, 'Service type created successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Update existing service type
 */
export const updateServiceType = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const payload = { ...req.body };
        
        // Backward compatibility mapping
        if (!payload.categoryIds && payload.categoryId) {
            payload.categoryIds = [payload.categoryId];
        }
        delete payload.categoryId;

        const serviceType = await ServiceType.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!serviceType) { sendContractErrorResponse(req, res, 404, 'Service type not found'); return; }
        sendSuccessResponse(res, serviceType, 'Service type updated successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Toggle service type active status
 */
export const toggleServiceTypeStatus = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const serviceType = await ServiceType.findById(req.params.id);
        if (!serviceType) { sendContractErrorResponse(req, res, 404, 'Service type not found'); return; }
        serviceType.isActive = !serviceType.isActive;
        
        // Repair legacy mapping before save
        if ((!serviceType.categoryIds || serviceType.categoryIds.length === 0) && serviceType.categoryId) {
            serviceType.categoryIds = [serviceType.categoryId];
        }

        await serviceType.save();
        sendSuccessResponse(res, serviceType, 'Service type status toggled');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Delete service type (soft delete with dependency check)
 */
export const deleteServiceType = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }

        const serviceType = await ServiceType.findById(req.params.id);
        if (!serviceType) { sendContractErrorResponse(req, res, 404, 'Service type not found'); return; }

        // USAGE CHECK: check canonical ObjectId references and legacy string names in active Ads.
        const inUseCount = await Ad.countDocuments({
            status: AD_STATUS.LIVE,
            $or: [
                { serviceTypeIds: serviceType._id },
                { serviceTypes: serviceType.name }
            ]
        });
        if (inUseCount > 0) {
            sendContractErrorResponse(req, res, 409, 'Service type is in use', {
                message: 'This service type cannot be deleted because it is currently linked to active services in the marketplace.',
                dependencies: {
                    services: inUseCount,
                    total: inUseCount
                }
            });
            return;
        }

        await (serviceType as unknown as { softDelete: () => Promise<void> }).softDelete();
        sendSuccessResponse(res, null, 'Service type deleted successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
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
        if (!size) { sendContractErrorResponse(req, res, 404, 'Screen size not found'); return; }
        sendSuccessResponse(res, size);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new screen size
 */
export const createScreenSize = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }

        const parsed = screenSizeCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const payload = { ...parsed.data };
        if (!payload.name && payload.size) {
            payload.name = `${payload.size} Screen Size`;
        }
        const relation = await validateScreenSizeRelations({ categoryId: payload.categoryId, brandId: payload.brandId });
        if (!relation.ok) {
            sendContractErrorResponse(req, res, 400, relation.reason || 'Invalid relation');
            return;
        }

        const size = await ScreenSize.create(payload);
        sendSuccessResponse(res, size, 'Screen size created successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Update existing screen size
 */
export const updateScreenSize = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const existingSize = await ScreenSize.findById(req.params.id).select('categoryId brandId');
        if (!existingSize) { sendContractErrorResponse(req, res, 404, 'Screen size not found'); return; }

        const parsed = screenSizeUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const payload = { ...parsed.data };
        if (!payload.name && payload.size) {
            payload.name = `${payload.size} Screen Size`;
        }
        const nextCategoryId = payload.categoryId || String(existingSize.categoryId);
        const nextBrandId = payload.brandId ?? (existingSize.brandId ? String(existingSize.brandId) : undefined);
        const relation = await validateScreenSizeRelations({ categoryId: nextCategoryId, brandId: nextBrandId });
        if (!relation.ok) {
            sendContractErrorResponse(req, res, 400, relation.reason || 'Invalid relation');
            return;
        }

        const size = await ScreenSize.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!size) { sendContractErrorResponse(req, res, 404, 'Screen size not found'); return; }
        sendSuccessResponse(res, size, 'Screen size updated successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Delete screen size (soft delete)
 */
export const deleteScreenSize = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const size = await ScreenSize.findById(req.params.id);
        if (!size) { sendContractErrorResponse(req, res, 404, 'Screen size not found'); return; }
        await size.softDelete();
        sendSuccessResponse(res, null, 'Screen size deleted successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};
