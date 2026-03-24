import mongoose, { ClientSession } from 'mongoose';
import Category, { ICategory } from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import ScreenSize from '../../models/ScreenSize';
import { clearCachePattern } from '../../utils/redisCache';
import logger from '../../utils/logger';

type CascadeDoc = {
    _id: mongoose.Types.ObjectId;
    categoryIds?: mongoose.Types.ObjectId[];
    categoryId?: mongoose.Types.ObjectId;
    brandId?: mongoose.Types.ObjectId;
};

const isDuplicateKeyError = (error: unknown): boolean => {
    const err = error as { code?: number };
    return err?.code === 11000;
};

const toUniqueCategoryObjectIds = (
    categoryIds: mongoose.Types.ObjectId[] | undefined,
    deletedCategoryId: string
): mongoose.Types.ObjectId[] => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) return [];
    const deduped = new Map<string, mongoose.Types.ObjectId>();
    for (const categoryObjectId of categoryIds) {
        const id = String(categoryObjectId);
        if (id === deletedCategoryId) continue;
        if (!deduped.has(id)) {
            deduped.set(id, new mongoose.Types.ObjectId(id));
        }
    }
    return Array.from(deduped.values());
};

/**
 * CatalogOrchestrator
 * 
 * The Single Source of Truth (SSOT) for catalog domain orchestration.
 * Consolidates CRUD operations, cache management, and hierarchy integrity.
 */
export class CatalogOrchestrator {
    /**
     * Invalidate all catalog-swapped caches
     */
    static async invalidateCatalogCache() {
        try {
            await Promise.all([
                clearCachePattern('catalog:*'),
                clearCachePattern('master:*'),
            ]);
            logger.info('Catalog cache invalidated (Unified)');
        } catch (error) {
            logger.error('Failed to invalidate catalog cache', { 
                error: error instanceof Error ? error.message : String(error) 
            });
        }
    }

    /**
     * Cascade Category soft-delete to Brands, Models, and deactivation of Parts
     */
    static async cascadeCategoryDelete(categoryId: string, session?: ClientSession) {
        const txSession = session || null;
        const now = new Date();
        const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
        const brandIdsToDelete: mongoose.Types.ObjectId[] = [];

        // 1) Brands: detach deleted category when other categories exist; soft-delete only true orphans.
        const linkedBrands = await Brand.find({ categoryIds: categoryObjectId })
            .select('_id categoryIds')
            .session(txSession)
            .lean<CascadeDoc[]>();

        for (const brand of linkedBrands) {
            const remainingCategoryIds = toUniqueCategoryObjectIds(brand.categoryIds, categoryId);
            if (remainingCategoryIds.length === 0) {
                brandIdsToDelete.push(brand._id);
                continue;
            }

            try {
                await Brand.updateOne(
                    { _id: brand._id },
                    { $set: { categoryIds: remainingCategoryIds } }
                ).session(txSession);
            } catch (error) {
                // Keep uniqueness intact; if remap collides, safely archive this duplicate branch.
                if (isDuplicateKeyError(error)) {
                    brandIdsToDelete.push(brand._id);
                    continue;
                }
                throw error;
            }
        }

        if (brandIdsToDelete.length > 0) {
            await Brand.updateMany(
                { _id: { $in: brandIdsToDelete } },
                { $set: { isDeleted: true, isActive: false, deletedAt: now } }
            ).session(txSession);
        }

        // 2) Models: never delete by brand sweep unless brand is actually archived.
        //    Prefer detaching deleted category; soft-delete only if model becomes orphaned.
        const modelOrFilters: Array<Record<string, unknown>> = [
            { categoryId: categoryObjectId },
            { categoryIds: categoryObjectId },
        ];
        if (brandIdsToDelete.length > 0) {
            modelOrFilters.push({ brandId: { $in: brandIdsToDelete } });
        }

        const affectedModels = await Model.find({ $or: modelOrFilters })
            .select('_id brandId categoryId categoryIds')
            .session(txSession)
            .lean<CascadeDoc[]>();

        const modelIdsToDelete: mongoose.Types.ObjectId[] = [];
        const deletedBrandIdSet = new Set(brandIdsToDelete.map((id) => String(id)));

        for (const model of affectedModels) {
            if (model.brandId && deletedBrandIdSet.has(String(model.brandId))) {
                modelIdsToDelete.push(model._id);
                continue;
            }

            const remainingCategoryIds = toUniqueCategoryObjectIds(model.categoryIds, categoryId);
            const primaryCategoryId = model.categoryId ? String(model.categoryId) : '';

            if (primaryCategoryId === categoryId) {
                if (remainingCategoryIds.length === 0) {
                    modelIdsToDelete.push(model._id);
                    continue;
                }

                try {
                    await Model.updateOne(
                        { _id: model._id },
                        {
                            $set: {
                                categoryId: remainingCategoryIds[0],
                                categoryIds: remainingCategoryIds,
                            },
                        }
                    ).session(txSession);
                } catch (error) {
                    if (isDuplicateKeyError(error)) {
                        modelIdsToDelete.push(model._id);
                        continue;
                    }
                    throw error;
                }
                continue;
            }

            await Model.updateOne(
                { _id: model._id },
                { $set: { categoryIds: remainingCategoryIds } }
            ).session(txSession);
        }

        if (modelIdsToDelete.length > 0) {
            await Model.updateMany(
                { _id: { $in: modelIdsToDelete } },
                { $set: { isDeleted: true, isActive: false, deletedAt: now } }
            ).session(txSession);
        }

        // 3) SpareParts: detach category when possible; soft-delete only if no category remains
        //    or if parent brand is archived by this cascade.
        const sparePartOrFilters: Array<Record<string, unknown>> = [{ categoryIds: categoryObjectId }];
        if (brandIdsToDelete.length > 0) {
            sparePartOrFilters.push({ brandId: { $in: brandIdsToDelete } });
        }

        const affectedSpareParts = await SparePart.find({ $or: sparePartOrFilters })
            .select('_id brandId categoryIds')
            .session(txSession)
            .lean<CascadeDoc[]>();

        const sparePartIdsToDelete: mongoose.Types.ObjectId[] = [];
        for (const sparePart of affectedSpareParts) {
            if (sparePart.brandId && deletedBrandIdSet.has(String(sparePart.brandId))) {
                sparePartIdsToDelete.push(sparePart._id);
                continue;
            }

            const remainingCategoryIds = toUniqueCategoryObjectIds(sparePart.categoryIds, categoryId);
            if (remainingCategoryIds.length === 0) {
                sparePartIdsToDelete.push(sparePart._id);
                continue;
            }

            await SparePart.updateOne(
                { _id: sparePart._id },
                { $set: { categoryIds: remainingCategoryIds } }
            ).session(txSession);
        }

        if (sparePartIdsToDelete.length > 0) {
            await SparePart.updateMany(
                { _id: { $in: sparePartIdsToDelete } },
                { $set: { isDeleted: true, isActive: false, deletedAt: now } }
            ).session(txSession);
        }

        // 4) ScreenSizes: singular category link; keep cascading delete.
        const screenSizeFilter = brandIdsToDelete.length > 0
            ? { $or: [{ categoryId: categoryObjectId }, { brandId: { $in: brandIdsToDelete } }] }
            : { categoryId: categoryObjectId };
        await ScreenSize.updateMany(
            screenSizeFilter,
            { $set: { isDeleted: true, isActive: false, deletedAt: now } }
        ).session(txSession);

        await this.invalidateCatalogCache();
        logger.info('Cascaded category delete completed', {
            categoryId,
            brandsArchived: brandIdsToDelete.length,
            modelsArchived: modelIdsToDelete.length,
            sparePartsArchived: sparePartIdsToDelete.length,
        });
    }

    /**
     * Cascade Brand soft-delete to Models
     */
    static async cascadeBrandDelete(brandId: string, session?: ClientSession) {
        await Model.updateMany(
            { brandId },
            { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
        ).session(session || null);

        await this.invalidateCatalogCache();
        logger.info(`Cascaded soft-delete for brand: ${brandId}`);
    }

    /**
     * Create Category with cache invalidation
     */
    static async createCategory(data: Partial<ICategory>): Promise<ICategory> {
        const category = new Category(data);
        const result = await category.save();
        await this.invalidateCatalogCache();
        return result;
    }

    /**
     * Update Category with cache invalidation
     */
    static async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
        const result = await Category.findByIdAndUpdate(id, data, { new: true });
        if (result) await this.invalidateCatalogCache();
        return result;
    }

    /**
     * Resolve CategoryID from a BrandID (Helper)
     * Returns the first category if multiple exist (Legacy compatibility)
     */
    static async resolveCategoryIdFromBrand(brandId: string): Promise<string | null> {
        const brand = await Brand.findById(brandId).select('categoryIds').lean();
        if (!brand || !brand.categoryIds || brand.categoryIds.length === 0) return null;
        const firstCategoryId = brand.categoryIds[0];
        return firstCategoryId ? firstCategoryId.toString() : null;
    }

    /**
     * Resolve all CategoryIDs from a BrandID
     */
    static async resolveCategoryIdsFromBrand(brandId: string): Promise<string[]> {
        const brand = await Brand.findById(brandId).select('categoryIds').lean();
        if (!brand || !brand.categoryIds) return [];
        return brand.categoryIds.map(id => id.toString());
    }

    /**
     * Detach SpareParts from a specific Model
     */
    static async detachSparePartsFromModel(modelId: string, session?: ClientSession) {
        await SparePart.updateMany(
            { modelId },
            { $set: { modelId: null, isActive: false } }
        ).session(session || null);
        
        logger.info(`Detached spare parts from model: ${modelId}`);
    }
}

export default CatalogOrchestrator;
