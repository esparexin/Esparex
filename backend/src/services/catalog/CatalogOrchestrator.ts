import mongoose, { ClientSession } from 'mongoose';
import Category, { ICategory } from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import ScreenSize from '../../models/ScreenSize';
import { clearCachePattern } from '../../utils/redisCache';
import logger from '../../utils/logger';

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
        const brands = await Brand.find({ categoryIds: categoryId }).select('_id').session(session || null);
        const brandIds = brands.map(b => b._id);

        if (brandIds.length > 0) {
            // Soft-delete Brands using updateMany for efficiency but aligning with plugin fields
            await Brand.updateMany(
                { _id: { $in: brandIds } },
                { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
            ).session(session || null);

            // Soft-delete Models linked to these brands
            await Model.updateMany(
                { brandId: { $in: brandIds } },
                { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
            ).session(session || null);
        }

        // Soft-delete Models directly linked to this category (New plural mapping)
        await Model.updateMany(
            { categoryIds: categoryId },
            { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
        ).session(session || null);

        // Deactivate SpareParts linked to this category
        await SparePart.updateMany(
            { categoryIds: categoryId },
            { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
        ).session(session || null);

        // Deactivate ScreenSizes linked to this category
        await ScreenSize.updateMany(
            { categoryId },
            { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
        ).session(session || null);

        await this.invalidateCatalogCache();
        logger.info(`Cascaded soft-delete for category: ${categoryId}`);
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
