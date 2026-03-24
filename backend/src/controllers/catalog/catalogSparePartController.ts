/**
 * Catalog Spare Parts Controller
 * Handles spare parts and user proposals
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { handlePaginatedContent } from '../../utils/contentHandler';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { z, ZodError } from 'zod';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import Ad from '../../models/Ad';
import { sendSuccessResponse } from '../admin/adminBaseController';
import { resolveEquivalentActiveCategoryIds } from '../../utils/categoryCanonical';
import {
    getActiveCategoryIds,
    sendValidationError,
    sendEmptyPublicList,
    hasAdminAccess,
    sendCatalogError,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    validateActiveCategories
} from './shared';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { normalizeObjectIdLike } from '../../utils/idUtils';
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES } from '../../../../shared/enums/catalogStatus';
import { validateSparePartRelations } from '../../services/catalog/CatalogValidationService';
import {
    sparePartCreateSchema,
    sparePartUpdateSchema,
    rejectionSchema
} from '../../validators/catalog.validator';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';

// Local schemas replaced by centralized catalog.validator.ts


/**
 * Get all spare parts (with optional category filter and status)
 */
export const getSpareParts = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { isActive } = req.query;
    const categoryParam = (req.query.categoryId || req.query.category) as string | undefined;

    let categoryObjectId: string | undefined = categoryParam;
    if (categoryParam && !mongoose.Types.ObjectId.isValid(categoryParam)) {
        const cat = await Category.findOne({ slug: categoryParam, ...(isAdminView ? {} : ACTIVE_CATEGORY_QUERY) });
        if (cat) {
            categoryObjectId = cat._id.toString();
        } else if (!isAdminView) {
            return sendEmptyPublicList(res);
        }
    }
    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await validateActiveCategories([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            return sendEmptyPublicList(res);
        }
    }

    const activeCategoryIds = !isAdminView
        ? (
            categoryObjectId
                ? await resolveEquivalentActiveCategoryIds(categoryObjectId)
                : await getActiveCategoryIds()
        )
        : [];
    if (!isAdminView && activeCategoryIds.length === 0) {
        return sendEmptyPublicList(res);
    }

    // Performance optimization: Instead of separate finds, we'll use the main query to filter by active categories/brands/models
    // but only if they are provided. For the initial list, we rely on SparePart's own relation fields.
    const [activeBrandsRaw, activeModelsRaw] = !isAdminView
        ? await Promise.all([
            // FIX: categoryIds → categoryId (legacy) is actually now categoryIds in Brand
            Brand.find({
                isActive: true,
                isDeleted: { $ne: true },
                $or: [
                    { status: CATALOG_STATUS.ACTIVE },
                    { status: { $exists: false } }
                ],
                categoryIds: { $in: activeCategoryIds }
            }).select('_id').lean(),
            Model.find({
                isActive: true,
                $or: [
                    { status: CATALOG_STATUS.ACTIVE },
                    { status: { $exists: false } }
                ],
                categoryIds: { $in: activeCategoryIds }
            }).select('_id').lean()
        ])
        : [[], []];
    const activeBrandIds = activeBrandsRaw.map((brand) => String(brand._id));
    const activeModelIds = activeModelsRaw.map((model) => String(model._id));

    const adminQuery: QueryRecord = CategoryQueryBuilder.forPlural().withFilters({ categoryId: categoryObjectId }).build();
    if (isActive !== undefined) adminQuery.isActive = isActive === 'true';

    const publicQuery: QueryRecord = { 
        isActive: true,
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

    // Prevent handlePaginatedContent from applying raw query params (category/categoryId)
    const cleanQuery = { ...req.query };
    delete cleanQuery.categoryId;
    delete cleanQuery.category;

    // Placement-based filtering:
    // 'postad' -> Only parts with ['postad'] in listingType (Feature parts)
    // 'postsparepart' -> Only parts with ['postsparepart'] in listingType (Inventory parts)
    const placement = req.query.placement as string;
    if (placement === 'postad' || placement === 'postsparepart') {
        publicQuery.listingType = { $in: [placement] };
        adminQuery.listingType = { $in: [placement] };
        delete cleanQuery.placement;
    }

    return handlePaginatedContent(req, res, SparePart, {
        adminQuery,
        publicQuery,
        queryParams: cleanQuery,
        defaultSort: { sortOrder: 1 }
    });
};

/**
 * Create new spare part (admin only)
 */
export const createSparePart = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const parsed = sparePartCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const payload = { ...parsed.data };
        
        // Backward compatibility mapping
        if (!payload.categoryIds && payload.categoryId) {
            payload.categoryIds = [payload.categoryId];
        }
        delete payload.categoryId;

        const {
            name,
            listingType,
            categoryIds,
            sortOrder = 0,
            filters = [],
            isActive = true,
            rejectionReason,
            brandId,
            modelId
        } = payload;
        const userId = req.user?._id ?? req.user?.id;
        const adminId = typeof userId === 'string' ? userId : (userId && typeof userId.toString === 'function' ? userId.toString() : undefined);

        const validatedCategoryIds = CategoryQueryBuilder.forPlural().withFilters({ categoryIds }).getRawIds();
        const relation = await validateSparePartRelations({ categoryIds: validatedCategoryIds, brandId, modelId });
        if (!relation.ok) {
            sendContractErrorResponse(req, res, 400, relation.reason || 'Invalid relation');
            return;
        }

        const slug = slugify(name, { lower: true });
        const existingSparePart = await SparePart.findOne({ slug }).select('_id name slug categoryIds brandId modelId');
        if (existingSparePart) {
            sendContractErrorResponse(req, res, 409, 'Spare part already exists', {
                existing: {
                    id: existingSparePart._id,
                    name: existingSparePart.name,
                    slug: existingSparePart.slug,
                    categoryIds: existingSparePart.categoryIds,
                    brandId: existingSparePart.brandId,
                    modelId: existingSparePart.modelId
                }
            });
            return;
        }

        const sparePart = await SparePart.create({
            name,
            slug,
            listingType: listingType || ['postsparepart'],
            categoryIds,
            ...(brandId ? { brandId } : {}),
            ...(modelId ? { modelId } : {}),
            sortOrder,
            filters,
            isActive,
            ...(rejectionReason ? { rejectionReason } : {}),
            usageCount: 0,
            createdBy: adminId
        });

        // Patch 3: invalidate taxonomy cache so admin dropdowns reflect new spare part
        void CatalogOrchestrator.invalidateCatalogCache();

        sendSuccessResponse(res, sparePart, 'Spare part created successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Update existing spare part
 */
export const updateSparePart = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const existingPart = await SparePart.findById(req.params.id).select('categoryIds brandId modelId');
        if (!existingPart) { sendContractErrorResponse(req, res, 404, 'Spare part not found'); return; }

        const parsed = sparePartUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const payload = { ...parsed.data };
        
        // Backward compatibility mapping
        if (!payload.categoryIds && payload.categoryId) {
            payload.categoryIds = [payload.categoryId];
        }
        delete payload.categoryId;
        if (payload.name) payload.slug = slugify(payload.name, { lower: true, strict: true });
        
        // Use renamed categoryIds from and to payload
        const nextCategories = payload.categoryIds || (existingPart as any).categoryIds.map((id: any) => String(id));
        const nextBrandId = payload.brandId ?? (existingPart.brandId ? String(existingPart.brandId) : undefined);
        const nextModelId = payload.modelId ?? (existingPart.modelId ? String(existingPart.modelId) : undefined);
        const relation = await validateSparePartRelations({
            categoryIds: nextCategories,
            brandId: nextBrandId,
            modelId: nextModelId
        });
        if (!relation.ok) {
            sendContractErrorResponse(req, res, 400, relation.reason || 'Invalid relation');
            return;
        }

        const sparePart = await SparePart.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
        if (!sparePart) { sendContractErrorResponse(req, res, 404, 'Spare part not found'); return; }

        // Patch 3: invalidate taxonomy cache so admin dropdowns reflect updated spare part
        void CatalogOrchestrator.invalidateCatalogCache();

        sendSuccessResponse(res, sparePart, 'Spare part updated successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Delete spare part (soft delete with dependency check)
 */
export const deleteSparePart = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const sparePartId = req.params.id;
        const sparePart = await SparePart.findById(sparePartId);
        if (!sparePart) { sendContractErrorResponse(req, res, 404, 'Spare part not found'); return; }

        const adsCount = await Ad.countDocuments({ sparePartIds: sparePart._id });
        if (adsCount > 0) {
            sendContractErrorResponse(req, res, 409, 'Cannot delete spare part', {
                message: `This spare part "${sparePart.name}" is currently in use.`,
                dependencies: {
                    ads: adsCount,
                    total: adsCount
                }
            });
            return;
        }

        await sparePart.softDelete();
        sendSuccessResponse(res, null, 'Spare part deleted successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Get single spare part by ID
 */
export const getSparePartById = async (req: Request, res: Response) => {
    try {
        const sparePart = await SparePart.findById(req.params.id);
        if (!sparePart) { sendContractErrorResponse(req, res, 404, 'Spare part not found'); return; }
        sendSuccessResponse(res, sparePart);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

