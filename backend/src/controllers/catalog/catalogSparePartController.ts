/**
 * Catalog Spare Parts Controller
 * Handles spare parts and user proposals
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import { handlePaginatedContent } from '../../utils/contentHandler';
import mongoose from 'mongoose';
import slugify from 'slugify';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import Ad from '../../models/Ad';
import { 
    sendAdminError,
    sendSuccessResponse
} from '../admin/adminBaseController';
import { resolveEquivalentActiveCategoryIds } from '../../utils/categoryCanonical';
import {
    sendCatalogError,
    asModel,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    validateActiveCategories,
    getActiveCategoryIds,
    handleCatalogCreate,
    handleCatalogUpdate,
    handleCatalogDelete,
    sendEmptyPublicList,
    getAdminActorId
} from './shared';
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { validateSparePartRelations } from '../../services/catalog/CatalogValidationService';
import {
    sparePartCreateSchema,
    sparePartUpdateSchema
} from '../../validators/catalog.validator';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';
import { ISparePart } from '../../models/SparePart';
import { LISTING_TYPE, type ListingTypeValue } from '../../../../shared/enums/listingType';
import { categoryEnumToRecord } from '../../../../shared/utils/listingTypeMap';

const normalizeSparePartListingType = (value: unknown): ListingTypeValue | undefined => {
    if (typeof value !== 'string') return undefined;
    if (value === LISTING_TYPE.AD || value === LISTING_TYPE.SPARE_PART) {
        return value;
    }
    if (value === 'postad' || value === 'postsparepart') {
        return categoryEnumToRecord(value);
    }
    return undefined;
};

// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// SparePart CRUD now delegated to shared.ts generic handlers.

/**
 * Get all spare parts (with optional category filter and status)
 */
export const getSpareParts = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { status } = req.query;
    const categoryParam = (req.query.categoryId || req.query.category) as string | undefined;
    const requestedListingType =
        normalizeSparePartListingType(req.query.listingType) ??
        normalizeSparePartListingType(req.query.placement);

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
                categoryId: { $in: activeCategoryIds }
            }).select('_id').lean()
        ])
        : [[], []];
    const activeBrandIds = activeBrandsRaw.map((brand) => String(brand._id));
    const activeModelIds = activeModelsRaw.map((model) => String(model._id));

    const adminQuery: QueryRecord = CategoryQueryBuilder.forPlural().withFilters({ categoryId: categoryObjectId }).build();
    if (status) adminQuery.status = status;

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
    delete cleanQuery.listingType;
    delete cleanQuery.placement;

    if (requestedListingType) {
        publicQuery.listingType = requestedListingType;
        adminQuery.listingType = requestedListingType;
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
    return handleCatalogCreate(req, res, asModel<ISparePart>(SparePart), sparePartCreateSchema, {
        auditAction: 'SPARE_PART_CREATE',
        slugifyName: true,
        preOp: async (payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;

            const validatedCategoryIds = CategoryQueryBuilder.forPlural().withFilters({ categoryIds: payload.categoryIds }).getRawIds();
            const relation = await validateSparePartRelations({ categoryIds: validatedCategoryIds, brandId: payload.brandId, modelId: payload.modelId });
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');

            payload.createdBy = getAdminActorId(req);
            payload.listingType = payload.listingType?.length ? payload.listingType : [LISTING_TYPE.SPARE_PART];
            payload.usageCount = 0;
            
            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Update existing spare part
 */
export const updateSparePart = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, asModel<ISparePart>(SparePart), sparePartUpdateSchema, {
        auditAction: 'SPARE_PART_UPDATE',
        preUpdate: async (id, payload, existingPart) => {
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
            if (!relation.ok) throw new Error(relation.reason || 'Invalid relation');

            return payload;
        },
        postOp: () => void CatalogOrchestrator.invalidateCatalogCache()
    });
};

/**
 * Delete spare part (soft delete with dependency check)
 */
export const deleteSparePart = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, asModel<ISparePart>(SparePart) as any, async (id) => {
        const adsCount = await Ad.countDocuments({ sparePartIds: id });
        return {
            count: adsCount,
            details: { ads: adsCount }
        };
    }, { auditAction: 'SPARE_PART_DELETE' });
};

/**
 * Get single spare part by ID
 */
export const getSparePartById = async (req: Request, res: Response) => {
    try {
        const sparePart = await SparePart.findById(req.params.id);
        if (!sparePart) return sendAdminError(req, res, 'Spare part not found', 404);
        sendSuccessResponse(res, sparePart);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};
