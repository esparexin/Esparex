/**
 * Catalog Brand & Model Controller
 * Handles brands and models together due to close relationship
 * Extracted from catalog.content.controller.ts
 */

import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { handlePaginatedContent } from '../../utils/contentHandler';
import mongoose from 'mongoose';
import { z, ZodError } from 'zod';
import slugify from 'slugify';
import { nanoid } from 'nanoid';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import Ad from '../../models/Ad';
import SparePart from '../../models/SparePart';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { logAdminAction } from '../../utils/adminLogger';
import { sendSuccessResponse } from '../admin/adminBaseController';
import { escapeRegExp } from '../../utils/stringUtils';
import CatalogOrchestrator from '../../services/catalog/CatalogOrchestrator';
import {
    hasAdminAccess,
    sendCatalogError,
    asModel,
    QueryRecord,
    ACTIVE_CATEGORY_QUERY,
    validateActiveCategories,
    getActiveCategoryIds
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

const isDuplicateKeyError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { code?: unknown; message?: unknown };
    if (candidate.code === 11000) return true;
    if (typeof candidate.message === 'string' && candidate.message.includes('E11000')) return true;
    return false;
};

const ensureCategoriesAreActive = async (categoryIds: string[]): Promise<{ ok: boolean; invalidCategoryIds: string[] }> => {
    return validateActiveCategories(categoryIds);
};

const uniqueObjectIds = (ids: Array<string | mongoose.Types.ObjectId>): mongoose.Types.ObjectId[] => {
    const deduped = new Map<string, mongoose.Types.ObjectId>();
    for (const id of ids) {
        const value = typeof id === 'string' ? id : id.toString();
        if (!mongoose.Types.ObjectId.isValid(value)) continue;
        if (!deduped.has(value)) {
            deduped.set(value, new mongoose.Types.ObjectId(value));
        }
    }
    return Array.from(deduped.values());
};

const findBrandByNameIncludingDeleted = async (name: string) => {
    const brandRegex = new RegExp(`^${escapeRegExp(name)}$`, 'i');
    return Brand.findOne({ name: { $regex: brandRegex } }).setOptions({ withDeleted: true });
};


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
        sendContractErrorResponse(req, res, 400, 'categoryId is required');
        return;
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
        const brand = await Brand.findById(req.params.id).populate('categoryIds');
        if (!brand) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }
        sendSuccessResponse(res, brand);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new brand
 */
export const createBrand = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const parsed = brandCreateSchema.safeParse(req.body);
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

        const incomingCategoryIds = ((payload.categoryIds as string[] | undefined) || []).map(String);
        const categoryValidation = await ensureCategoriesAreActive(incomingCategoryIds);
        if (!categoryValidation.ok) {
            sendContractErrorResponse(req, res, 400, 'One or more provided categoryIds are invalid or inactive', {
                invalidCategoryIds: categoryValidation.invalidCategoryIds
            });
            return;
        }

        const existingBrand = await findBrandByNameIncludingDeleted(String(payload.name));
        if (existingBrand) {
            const mergedCategoryIds = uniqueObjectIds([
                ...(existingBrand.categoryIds || []),
                ...incomingCategoryIds
            ]);

            existingBrand.categoryIds = mergedCategoryIds;
            existingBrand.isDeleted = false;
            existingBrand.deletedAt = undefined;
            existingBrand.isActive = payload.isActive ?? true;
            existingBrand.status = (payload.status as typeof existingBrand.status | undefined) ?? CATALOG_STATUS.ACTIVE;
            if (payload.rejectionReason !== undefined) {
                existingBrand.rejectionReason = payload.rejectionReason as string | undefined;
            }
            if (!existingBrand.slug || String(existingBrand.slug).trim().length === 0) {
                existingBrand.slug = slugify(String(payload.name), { lower: true, strict: true, trim: true }) + '-' + nanoid(5);
            }

            await existingBrand.save();

            sendSuccessResponse(res, existingBrand, 'Brand already existed; categories merged without duplicates');
            return;
        }

        const payloadWithSlug = {
            ...payload,
            slug: slugify(payload.name as string, { lower: true, strict: true, trim: true }) + '-' + nanoid(5)
        };
        const brand = await Brand.create(payloadWithSlug as any);
        sendSuccessResponse(res, brand, 'Brand created successfully');
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            sendContractErrorResponse(req, res, 409, `"${req.body?.name || 'Brand'}" already exists. Select it from the dropdown.`);
            return;
        }
        sendCatalogError(req, res, error);
    }
};

/**
 * Update existing brand
 */
export const updateBrand = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const brandId = req.params.id;
        const oldBrand = await Brand.findById(brandId);
        if (!oldBrand) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }
        const parsed = brandUpdateSchema.safeParse(req.body);
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

        const nextCategoryIds = payload.categoryIds ? (payload.categoryIds as string[]).map(String) : (oldBrand.categoryIds || []).map(String);
        const categoryValidation = await ensureCategoriesAreActive(nextCategoryIds);
        if (!categoryValidation.ok) {
            sendContractErrorResponse(req, res, 400, 'One or more provided categoryIds are invalid or inactive', {
                invalidCategoryIds: categoryValidation.invalidCategoryIds
            });
            return;
        }

        const updatedBrand = await Brand.findByIdAndUpdate(brandId, payload as any, { new: true, runValidators: true });
        if (!updatedBrand) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }

        // AUDIT LOG
        logAdminAction(req, 'BRAND_RENAME', 'Brand', updatedBrand._id, {
            before: { name: oldBrand.name },
            after: { name: updatedBrand.name },
            impacted: { ads: 0, services: 0 }
        });

        sendSuccessResponse(res, updatedBrand, 'Brand updated successfully');
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            sendContractErrorResponse(req, res, 409, `"${req.body?.name || 'Brand'}" already exists. Select it from the dropdown.`);
            return;
        }
        sendCatalogError(req, res, error);
    }
};

/**
 * Toggle brand active status (auto-flips current isActive — no body required)
 */
export const toggleBrandStatus = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }

        const current = await Brand.findById(req.params.id);
        if (!current) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }

        const isActive = !current.isActive;
        const updates: Record<string, unknown> = {
            isActive,
            status: isActive ? CATALOG_STATUS.ACTIVE : CATALOG_STATUS.REJECTED,
        };
        if (isActive) updates.rejectionReason = null;

        const brand = await Brand.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!brand) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }
        sendSuccessResponse(res, brand, `Brand ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Delete brand (soft delete with dependency check)
 */
export const deleteBrand = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const brandId = req.params.id;
        const brand = await Brand.findById(brandId);
        if (!brand) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }

        const [modelsCount, listingsCount, sparePartsCount] = await Promise.all([
            Model.countDocuments({ brandId }),
            Ad.countDocuments({ brandId }),
            SparePart.countDocuments({ brandId })
        ]);

        const totalDependencies = modelsCount + listingsCount + sparePartsCount;

        if (totalDependencies > 0) {
            sendContractErrorResponse(req, res, 409, 'Cannot delete brand', {
                message: `This brand "${brand.name}" is currently in use and cannot be deleted.`,
                dependencies: {
                    models: modelsCount,
                    listings: listingsCount,
                    spareParts: sparePartsCount,
                    total: totalDependencies
                }
            });
            return;
        }

        await brand.softDelete();
        sendSuccessResponse(res, null, 'Brand deleted successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
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
        const model = await Model.findById(req.params.id).populate('brandId categoryIds');
        if (!model) { sendContractErrorResponse(req, res, 404, 'Model not found'); return; }
        sendSuccessResponse(res, model);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Create new model
 */
export const createModel = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const parsed = modelCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const payload: any = { ...parsed.data };
        
        // Auto-derive categoryId if missing
        if (!payload.categoryId) {
            const derivedId = await CatalogOrchestrator.resolveCategoryIdFromBrand(payload.brandId);
            if (!derivedId) {
                sendContractErrorResponse(req, res, 400, 'Invalid brandId: cannot resolve parent category');
                return;
            }
            payload.categoryId = derivedId;
        }

        // Sync categoryId <-> categoryIds for transition period
        if (payload.categoryId && (!payload.categoryIds || payload.categoryIds.length === 0)) {
            payload.categoryIds = [payload.categoryId];
        } else if (payload.categoryIds && payload.categoryIds.length > 0 && !payload.categoryId) {
            payload.categoryId = payload.categoryIds[0];
        }

        const brandActive = await Brand.exists({ _id: payload.brandId, isActive: true, isDeleted: { $ne: true } });
        if (!brandActive) {
            sendContractErrorResponse(req, res, 400, 'brandId must reference an active, non-deleted brand');
            return;
        }
        const model = await Model.create(payload as any);
        sendSuccessResponse(res, model, 'Model created successfully');
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            sendContractErrorResponse(req, res, 409, `"${req.body?.name || 'Model'}" already exists. Select it from the dropdown.`);
            return;
        }
        sendCatalogError(req, res, error);
    }
};

/**
 * Update existing model
 */
export const updateModel = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const modelId = req.params.id;
        const oldModel = await Model.findById(modelId);
        if (!oldModel) { sendContractErrorResponse(req, res, 404, 'Model not found'); return; }

        const parsed = modelUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const payload = parsed.data;
        if (payload.brandId) {
            const brandActive = await Brand.exists({ _id: payload.brandId, isActive: true, isDeleted: { $ne: true } });
            if (!brandActive) {
                sendContractErrorResponse(req, res, 400, 'brandId must reference an active, non-deleted brand');
                return;
            }
        }

        // Sync categoryId <-> categoryIds for transition period
        if (payload.categoryId && (!payload.categoryIds || payload.categoryIds.length === 0)) {
            (payload as any).categoryIds = [payload.categoryId];
        } else if (payload.categoryIds && payload.categoryIds.length > 0) {
            (payload as any).categoryId = payload.categoryIds[0];
        }

        const updatedModel = await Model.findByIdAndUpdate(modelId, payload as any, { new: true, runValidators: true });
        if (!updatedModel) { sendContractErrorResponse(req, res, 404, 'Model not found'); return; }

        // AUDIT LOG
        logAdminAction(req, 'MODEL_RENAME', 'Model', updatedModel._id, {
            before: { name: oldModel.name },
            after: { name: updatedModel.name },
            impacted: { ads: 0, services: 0 }
        });
        sendSuccessResponse(res, updatedModel, 'Model updated successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Delete model (soft delete with dependency check)
 */
export const deleteModel = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const modelId = req.params.id;
        const model = await Model.findById(modelId);
        if (!model) { sendContractErrorResponse(req, res, 404, 'Model not found'); return; }

        const [listingsCount, sparePartsCount] = await Promise.all([
            Ad.countDocuments({ modelId }),
            SparePart.countDocuments({ modelId })
        ]);

        const totalDependencies = listingsCount + sparePartsCount;

        if (totalDependencies > 0) {
            sendContractErrorResponse(req, res, 409, 'Cannot delete model', {
                message: `This model "${model.name}" is currently in use and cannot be deleted.`,
                dependencies: {
                    listings: listingsCount,
                    spareParts: sparePartsCount,
                    total: totalDependencies
                }
            });
            return;
        }

        await model.softDelete();
        sendSuccessResponse(res, null, 'Model deleted successfully');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Approve pending brand
 */
export const approveBrand = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const brand = await Brand.findByIdAndUpdate(req.params.id, { status: CATALOG_STATUS.ACTIVE, isActive: true }, { new: true });
        if (!brand) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }
        await logAdminAction(req, 'APPROVE_BRAND', 'Brand', brand._id, { name: brand.name });
        sendSuccessResponse(res, brand, 'Brand approved');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Reject pending brand
 */
export const rejectBrand = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const parsed = rejectionSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const { reason } = parsed.data;
        const brand = await Brand.findByIdAndUpdate(req.params.id, { status: CATALOG_STATUS.REJECTED, isActive: false, rejectionReason: reason }, { new: true });
        if (!brand) { sendContractErrorResponse(req, res, 404, 'Brand not found'); return; }
        await logAdminAction(req, 'REJECT_BRAND', 'Brand', brand._id, { name: brand.name, reason });
        sendSuccessResponse(res, brand, 'Brand rejected');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Approve pending model
 */
export const approveModel = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const model = await Model.findByIdAndUpdate(req.params.id, { status: CATALOG_STATUS.ACTIVE, isActive: true }, { new: true });
        if (!model) { sendContractErrorResponse(req, res, 404, 'Model not found'); return; }
        await logAdminAction(req, 'APPROVE_MODEL', 'Model', model._id, { name: model.name });
        sendSuccessResponse(res, model, 'Model approved');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * Reject pending model
 */
export const rejectModel = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) { sendContractErrorResponse(req, res, 403, 'Admin access required'); return; }
        const parsed = rejectionSchema.safeParse(req.body);
        if (!parsed.success) {
            sendValidationError(req, res, parsed.error);
            return;
        }
        const { reason } = parsed.data;
        const model = await Model.findByIdAndUpdate(req.params.id, { status: CATALOG_STATUS.REJECTED, isActive: false, rejectionReason: reason }, { new: true });
        if (!model) { sendContractErrorResponse(req, res, 404, 'Model not found'); return; }
        await logAdminAction(req, 'REJECT_MODEL', 'Model', model._id, { name: model.name, reason });
        sendSuccessResponse(res, model, 'Model rejected');
    } catch (error) {
        sendCatalogError(req, res, error);
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
            sendContractErrorResponse(req, res, 400, 'Missing fields');
            return;
        }
        const categoryActive = await Category.exists({ _id: categoryId, ...ACTIVE_CATEGORY_QUERY });
        if (!categoryActive) {
            sendContractErrorResponse(req, res, 400, 'categoryId must reference an active category');
            return;
        }

        // Optimistically search for Brand and any Model with that name under it
        const brandRegex = new RegExp(`^${escapeRegExp(brandName)}$`, 'i');
        const modelRegex = new RegExp(`^${escapeRegExp(modelName)}$`, 'i');

        let brand = await Brand.findOne({ name: { $regex: brandRegex } }).setOptions({ withDeleted: true });
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
        } else {
            const mergedCategoryIds = uniqueObjectIds([...(brand.categoryIds || []), categoryId]);
            brand.categoryIds = mergedCategoryIds;
            if (brand.isDeleted) {
                brand.isDeleted = false;
                brand.deletedAt = undefined;
            }
            await brand.save();
        }

        const brandId = String(brand._id);
        let model = await Model.findOne({ name: { $regex: modelRegex }, brandId });

        if (!model) {
            const modelVal = validateModelSuggestion(modelName);
            model = await Model.create({
                name: modelVal.cleanName || modelName,
                brandId: brand._id,
                categoryId: categoryId,
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
