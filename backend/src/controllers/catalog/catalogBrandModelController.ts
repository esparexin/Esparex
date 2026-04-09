/**
 * Catalog Brand & Model Controller
 * Handles brands and models together due to close relationship
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { handlePaginatedContent } from '../../utils/contentHandler';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import Ad from '../../models/Ad';
import SparePart from '../../models/SparePart';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { 
    sendSuccessResponse 
} from '../admin/adminBaseController';
import { escapeRegExp } from '../../utils/stringUtils';
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
import {
    sendCatalogError,
    asModel,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    validateActiveCategories,
    getActiveCategoryIds,
    handleCatalogCreate,
    handleCatalogUpdate,
    handleCatalogToggleStatus,
    handleCatalogDelete,
    handleCatalogReview,
    isDuplicateKeyError,
    sendEmptyPublicList
} from './shared';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { validateBrandSuggestion, validateModelSuggestion } from '../../utils/suggestionValidation';
import {
    brandCreateSchema,
    brandUpdateSchema,
    modelCreateSchema,
    modelUpdateSchema,
    rejectionSchema
} from '../../validators/catalog.validator';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';
import { IBrand } from '../../models/Brand';
import { IModel } from '../../models/Model';

// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// Most brand/model logic now delegated to shared.ts generic handlers.


/* ==========================================================
   BRANDS
   ========================================================== */

/**
 * Get all brands (with optional category filter)
 */
export const getBrands = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const categoryId = (req.query.categoryId || req.query.categoryIds) as string;
    let categoryObjectId: string | undefined = categoryId;
    if (!isAdminView && categoryId) {
        // Public view allows passing slug for categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await Category.findOne({ slug: categoryId, ...ACTIVE_CATEGORY_QUERY });
            if (cat) categoryObjectId = cat._id.toString();
        }
    }

    // Public view strictly requires categoryId
    if (!isAdminView && !categoryObjectId) {
        return sendCatalogError(req, res, 'categoryId is required', 400);
    }
    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await validateActiveCategories([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            return sendEmptyPublicList(res);
        }
    }

    const queryParams: QueryRecord = { ...(req.query as QueryRecord) };
    delete queryParams.categoryId;
    delete queryParams.categoryIds;

    // Updated: filter brands by categoryIds
    const categoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryId: categoryObjectId }).build();
    const adminCategoryFilter = CategoryQueryBuilder.forPlural().withFilters({ categoryId }).build();

    return handlePaginatedContent(req, res, asModel(Brand), {
        publicQuery: {
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ],
            ...categoryFilter
        },
        adminQuery: adminCategoryFilter,
        queryParams
    });
};

/**
 * Get single brand by ID
 */
export const getBrandById = async (req: Request, res: Response) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const brand = await Brand.findOne({
            _id: req.params.id,
            ...(isAdminView
                ? {}
                : {
                    isActive: true,
                    isDeleted: { $ne: true },
                    $or: [
                        { status: CATALOG_STATUS.ACTIVE },
                        { status: { $exists: false } }
                    ]
                })
        }).populate('categoryIds');
        if (!brand) return sendCatalogError(req, res, 'Brand not found', 404);
        sendSuccessResponse(res, brand);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Get single public brand by slug
 */
export const getBrandBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return sendCatalogError(req, res, 'Brand slug is required', 400);
        }

        const brand = await Brand.findOne({
            slug,
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ]
        }).populate('categoryIds');

        if (!brand) {
            return sendCatalogError(req, res, 'Brand not found', 404);
        }

        sendSuccessResponse(res, brand);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new brand
 */
export const createBrand = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, asModel<IBrand>(Brand), brandCreateSchema, {
        auditAction: 'BRAND_CREATE',
        slugifyName: true,
        preOp: async (payload) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;

            const categoryValidation = await validateActiveCategories((payload.categoryIds as string[]).map(String));
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        }
    });
};

/**
 * Update existing brand
 */
export const updateBrand = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, asModel<IBrand>(Brand), brandUpdateSchema, {
        auditAction: 'BRAND_RENAME',
        preUpdate: async (id, payload, oldBrand) => {
            // Backward compatibility mapping
            if (!payload.categoryIds && payload.categoryId) {
                payload.categoryIds = [payload.categoryId];
            }
            delete payload.categoryId;

            const nextCategoryIds = payload.categoryIds ? (payload.categoryIds as string[]).map(String) : (oldBrand.categoryIds || []).map(String);
            const categoryValidation = await validateActiveCategories(nextCategoryIds);
            if (!categoryValidation.ok) {
                throw new Error(`Invalid or inactive categories: ${categoryValidation.invalidCategoryIds.join(', ')}`);
            }
            return payload;
        }
    });
};

/**
 * Toggle brand active status
 */
export const toggleBrandStatus = async (req: Request, res: Response) => {
    return handleCatalogToggleStatus(req, res, asModel<IBrand>(Brand) as any, { auditAction: 'TOGGLE_BRAND_STATUS' });
};

/**
 * Delete brand (soft delete with dependency check)
 */
export const deleteBrand = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, asModel<IBrand>(Brand) as any, async (id) => {
        const [modelsCount, listingsCount, sparePartsCount] = await Promise.all([
            Model.countDocuments({ brandId: id }),
            Ad.countDocuments({ brandId: id }),
            SparePart.countDocuments({ brandId: id })
        ]);
        return {
            count: modelsCount + listingsCount + sparePartsCount,
            details: { models: modelsCount, listings: listingsCount, spareParts: sparePartsCount }
        };
    }, { auditAction: 'BRAND_DELETE' });
};

/**
 * Suggest a new brand (User interaction)
 */
export const suggestBrand = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?._id;
        if (!userId) { return sendContractErrorResponse(req, res, 401, 'Authentication required'); }

        const { name, categoryIds } = req.body;
        const validation = validateBrandSuggestion(name || '');
        if (!validation.isValid) return sendCatalogError(req, res, validation.error || 'Invalid name', 400);

        if (!categoryIds || !mongoose.Types.ObjectId.isValid(categoryIds)) {
            return sendCatalogError(req, res, 'Valid categoryIds is required', 400);
        }
        const categoryExists = await Category.exists({ _id: categoryIds, ...ACTIVE_CATEGORY_QUERY });
        if (!categoryExists) {
            return sendCatalogError(req, res, 'categoryIds must reference an active category', 400);
        }

        const cleanName = validation.cleanName;

        // Check for existing active brand
        const existing = await Brand.findOne({
            name: { $regex: new RegExp(`^${escapeRegExp(cleanName)}$`, 'i') },
            status: CATALOG_STATUS.ACTIVE
        }).lean();

        if (existing) {
            const typedExisting = existing as { _id: unknown; categoryIds?: unknown };
            const alreadyHasCategory = String(typedExisting.categoryIds) === categoryIds;

            if (alreadyHasCategory) {
                // Brand is active and already covers this category — user should select from dropdown
                return sendCatalogError(req, res, `"${cleanName}" already exists in this category. Select it from the dropdown.`, 409);
            }

            // Brand is already admin-approved in another category.
            // Under the new taxonomy model, a Brand strictly belongs to ONE category.
            // If they suggest the same name in a different category, we must create a new record.
            // Let it fall through to create a new Brand record.
        }

        // Check for pending from same user
        const alreadyPending = await Brand.findOne({
            name: { $regex: new RegExp(`^${escapeRegExp(cleanName)}$`, 'i') },
            status: CATALOG_STATUS.PENDING,
            categoryIds: categoryIds,
            suggestedBy: userId
        }).lean();

        if (alreadyPending) {
            return sendCatalogError(req, res, 'You already have a pending suggestion for this brand.', 409);
        }

        const brand = await Brand.create({
            name: cleanName,
            slug: slugify(cleanName, { lower: true, strict: true, trim: true }) + '-' + nanoid(5),
            categoryIds: [categoryIds],
            status: CATALOG_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId
        });

        res.status(201).json(respond({
            success: true,
            message: 'Brand suggestion submitted for review.',
            data: brand
        }));
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendCatalogError(req, res, new Error(`"${req.body?.name || 'Brand'}" already exists. Select it from the dropdown.`), { statusCode: 409 });
        }
        return sendCatalogError(req, res, error);
    }
};

/* ==========================================================
   MODELS
   ========================================================== */

/**
 * Get all models (with optional brand/category filters)
 */
export const getModels = async (req: Request, res: Response) => {
    const isAdminView = req.originalUrl.includes('/admin');
    const { brandId } = req.query;
    const brandObjectId = typeof brandId === 'string' ? brandId : undefined;
    const categoryId = req.query.categoryId as string;

    let categoryObjectId: string | undefined = categoryId;
    if (!isAdminView && categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const cat = await Category.findOne({ slug: categoryId, ...ACTIVE_CATEGORY_QUERY });
            if (cat) categoryObjectId = cat._id.toString();
        }
    }
    if (!isAdminView && categoryObjectId) {
        const activeCategoryValidation = await validateActiveCategories([categoryObjectId]);
        if (!activeCategoryValidation.ok) {
            return sendEmptyPublicList(res);
        }
    }

    let activeCategoryIds: string[] = [];
    if (!isAdminView) {
        activeCategoryIds = categoryObjectId ? [categoryObjectId] : await getActiveCategoryIds();
        if (activeCategoryIds.length === 0) {
            return sendEmptyPublicList(res);
        }
    }
    const activeBrandIds = !isAdminView
        ? (await Brand.find({
            isActive: true,
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ],
            categoryIds: { $in: activeCategoryIds }
        }).select('_id').lean()).map((brand) => String(brand._id))
        : [];
    if (!isAdminView && activeBrandIds.length === 0) {
        return sendEmptyPublicList(res);
    }

    const adminQuery: QueryRecord = {};
    if (brandId) adminQuery.brandId = brandId;
    if (categoryId) {
        Object.assign(adminQuery, CategoryQueryBuilder.forSingular().withFilters({ categoryId }).build());
    }

    const publicQuery: QueryRecord = {
        isActive: true,
        $or: [
            { status: CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ]
    };
    if (!isAdminView) {
        publicQuery.categoryId = { $in: activeCategoryIds };
        publicQuery.brandId = { $in: activeBrandIds };
    }
    if (brandObjectId) publicQuery.brandId = brandObjectId;
    if (categoryObjectId) {
        Object.assign(publicQuery, CategoryQueryBuilder.forSingular().withFilters({ categoryId: categoryObjectId }).build());
    }

    if (!isAdminView && brandObjectId) {
        const brandExists = await Brand.exists({
            _id: brandObjectId,
            isActive: true,
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ],
            categoryIds: { $in: activeCategoryIds }
        });
        if (!brandExists) {
            return sendEmptyPublicList(res);
        }
    }

    return handlePaginatedContent(req, res, asModel(Model), {
        populate: isAdminView ? undefined : 'brandId categoryIds',
        adminQuery,
        publicQuery,
        searchFields: ['name']
    });
};

/**
 * Get single model by ID
 */
export const getModelById = async (req: Request, res: Response) => {
    try {
        const isAdminView = req.originalUrl.includes('/admin');
        const model = await Model.findOne({
            _id: req.params.id,
            ...(isAdminView
                ? {}
                : {
                    isActive: true,
                    isDeleted: { $ne: true },
                    $or: [
                        { status: CATALOG_STATUS.ACTIVE },
                        { status: { $exists: false } }
                    ]
                })
        }).populate('brandId categoryIds');
        if (!model) return sendCatalogError(req, res, 'Model not found', 404);
        sendSuccessResponse(res, model);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Get single public model by slug.
 * Models do not persist a dedicated slug, so we resolve against the canonicalized name.
 */
export const getModelBySlug = async (req: Request, res: Response) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return sendCatalogError(req, res, 'Model slug is required', 400);
        }

        const humanizedSlug = slug.replace(/-/g, ' ');
        const slugPattern = new RegExp(
            `^${escapeRegExp(humanizedSlug).replace(/\s+/g, '[-\\s]+')}$`,
            'i'
        );

        const candidates = await Model.find({
            name: slugPattern,
            isActive: true,
            isDeleted: { $ne: true },
            $or: [
                { status: CATALOG_STATUS.ACTIVE },
                { status: { $exists: false } }
            ]
        }).populate('brandId categoryIds');

        const matches = candidates.filter((candidate) =>
            slugify(candidate.name || '', { lower: true, strict: true, trim: true }) === slug
        );

        if (matches.length === 0) {
            return sendCatalogError(req, res, 'Model not found', 404);
        }

        if (matches.length > 1) {
            return sendCatalogError(req, res, 'Model slug is ambiguous', 409);
        }

        sendSuccessResponse(res, matches[0]);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new model
 */
export const createModel = async (req: Request, res: Response) => {
    return handleCatalogCreate(req, res, asModel<IModel>(Model), modelCreateSchema, {
        auditAction: 'MODEL_CREATE',
        preOp: async (payload) => {
            // Auto-derive categoryId if missing
            if (!payload.categoryId) {
                const derivedId = await CatalogOrchestrator.resolveCategoryIdFromBrand(payload.brandId);
                if (!derivedId) throw new Error('Invalid brandId: cannot resolve parent category');
                payload.categoryId = derivedId.toString();
            }

            // Sync categoryId <-> categoryIds
            if (payload.categoryId && (!payload.categoryIds || payload.categoryIds.length === 0)) {
                payload.categoryIds = [payload.categoryId];
            } else if (payload.categoryIds && payload.categoryIds.length > 0 && !payload.categoryId) {
                payload.categoryId = payload.categoryIds[0];
            }

            const brandActive = await Brand.exists({ _id: payload.brandId, isActive: true, isDeleted: { $ne: true } });
            if (!brandActive) throw new Error('brandId must reference an active, non-deleted brand');
            
            return payload;
        }
    });
};

/**
 * Update existing model
 */
export const updateModel = async (req: Request, res: Response) => {
    return handleCatalogUpdate(req, res, asModel<IModel>(Model), modelUpdateSchema, {
        auditAction: 'MODEL_RENAME',
        preUpdate: async (id, payload) => {
            if (payload.brandId) {
                const brandActive = await Brand.exists({ _id: payload.brandId, isActive: true, isDeleted: { $ne: true } });
                if (!brandActive) throw new Error('brandId must reference an active, non-deleted brand');
            }
            // Sync categoryId <-> categoryIds
            if (payload.categoryId && (!payload.categoryIds || payload.categoryIds.length === 0)) {
                payload.categoryIds = [payload.categoryId];
            } else if (payload.categoryIds && payload.categoryIds.length > 0) {
                payload.categoryId = payload.categoryIds[0];
            }
            return payload;
        }
    });
};

/**
 * Delete model (soft delete with dependency check)
 */
export const deleteModel = async (req: Request, res: Response) => {
    return handleCatalogDelete(req, res, asModel<IModel>(Model) as any, async (id) => {
        const [listingsCount, sparePartsCount] = await Promise.all([
            Ad.countDocuments({ modelId: id }),
            SparePart.countDocuments({ modelId: id })
        ]);
        return {
            count: listingsCount + sparePartsCount,
            details: { listings: listingsCount, spareParts: sparePartsCount }
        };
    }, { auditAction: 'MODEL_DELETE' });
};

/**
 * Approve pending brand
 */
export const approveBrand = (req: Request, res: Response) => 
    handleCatalogReview(req, res, asModel<IBrand>(Brand), 'APPROVE', undefined, { auditAction: 'APPROVE_BRAND' });

/**
 * Reject pending brand
 */
export const rejectBrand = (req: Request, res: Response) => 
    handleCatalogReview(req, res, asModel<IBrand>(Brand), 'REJECT', rejectionSchema, { auditAction: 'REJECT_BRAND' });

/**
 * Approve pending model
 */
export const approveModel = (req: Request, res: Response) => 
    handleCatalogReview(req, res, asModel<IModel>(Model), 'APPROVE', undefined, { auditAction: 'APPROVE_MODEL' });

/**
 * Reject pending model
 */
export const rejectModel = (req: Request, res: Response) => 
    handleCatalogReview(req, res, asModel<IModel>(Model), 'REJECT', rejectionSchema, { auditAction: 'REJECT_MODEL' });

/**
 * Suggest a new model (User interaction)
 */
export const suggestModel = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?._id;
        if (!userId) { return sendContractErrorResponse(req, res, 401, 'Authentication required'); }

        const { name, brandId } = req.body;
        const validation = validateModelSuggestion(name || '');
        if (!validation.isValid) return sendCatalogError(req, res, validation.error || 'Invalid name', 400);

        if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
            return sendCatalogError(req, res, 'Valid brandId is required', 400);
        }

        const brandActive = await Brand.exists({ _id: brandId, isActive: true, isDeleted: { $ne: true } });
        if (!brandActive) {
            return sendCatalogError(req, res, 'brandId must reference an active brand', 400);
        }

        const cleanName = validation.cleanName;

        // Existing check
        const existing = await Model.findOne({
            name: { $regex: new RegExp(`^${escapeRegExp(cleanName)}$`, 'i') },
            brandId,
            status: CATALOG_STATUS.ACTIVE
        }).lean();

        if (existing) {
            return sendCatalogError(req, res, `"${cleanName}" already exists. Select it from the dropdown.`, 409);
        }

        const alreadyPending = await Model.findOne({
            name: { $regex: new RegExp(`^${escapeRegExp(cleanName)}$`, 'i') },
            status: CATALOG_STATUS.PENDING,
            brandId,
            suggestedBy: userId
        }).lean();

        if (alreadyPending) {
            return sendCatalogError(req, res, 'You already have a pending suggestion for this model.', 409);
        }

        const model = await Model.create({
            name: cleanName,
            brandId,
            status: CATALOG_STATUS.PENDING,
            isActive: false,
            suggestedBy: userId
        });

        res.status(201).json(respond({
            success: true,
            message: 'Model suggestion submitted for review.',
            data: model
        }));
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            return sendCatalogError(req, res, `"${req.body?.name || 'Model'}" already exists. Select it from the dropdown.`, 409);
        }
        return sendCatalogError(req, res, error);
    }
};

/**
 * Ensure model exists (create brand + model if needed)
 */
export const ensureModel = async (req: Request, res: Response) => {
    try {
        const { categoryId, brandName, modelName } = req.body;
        const userId = (req as any).user?.id || (req as any).user?._id;

        if (!categoryId || !brandName || !modelName) {
            return sendCatalogError(req, res, 'Missing fields', 400);
        }
        const categoryActive = await Category.exists({ _id: categoryId, ...ACTIVE_CATEGORY_QUERY });
        if (!categoryActive) {
            return sendCatalogError(req, res, 'categoryId must reference an active category', 400);
        }

        // Optimistically search for Brand and any Model with that name under it
        const brandRegex = new RegExp(`^${escapeRegExp(brandName)}$`, 'i');
        const modelRegex = new RegExp(`^${escapeRegExp(modelName)}$`, 'i');

        let brand = await Brand.findOne({ name: { $regex: brandRegex }, categoryIds: categoryId });
        if (!brand) {
            const brandVal = validateBrandSuggestion(brandName);
            brand = await Brand.create({
                name: brandVal.cleanName || brandName,
                slug: slugify(brandVal.cleanName || brandName, { lower: true, strict: true, trim: true }) + '-' + nanoid(5),
                categoryIds: [categoryId],
                isActive: false,
                status: CATALOG_STATUS.PENDING,
                suggestedBy: userId
            });
        }

        const brandId = String(brand._id);
        let model = await Model.findOne({ name: { $regex: modelRegex }, brandId });

        if (!model) {
            const modelVal = validateModelSuggestion(modelName);
            model = await Model.create({
                name: modelVal.cleanName || modelName,
                brandId: brand._id,
                categoryIds: [categoryId],
                isActive: false,
                status: CATALOG_STATUS.PENDING,
                suggestedBy: userId
            });
        }

        res.status(201).json(respond({ success: true, data: model }));
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};
