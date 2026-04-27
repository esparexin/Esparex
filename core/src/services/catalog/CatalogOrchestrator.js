"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogOrchestrator = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = __importDefault(require("@core/models/Category"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
const SparePart_1 = __importDefault(require("@core/models/SparePart"));
const ScreenSize_1 = __importDefault(require("@core/models/ScreenSize"));
const redisCache_1 = require("@core/utils/redisCache");
const logger_1 = __importDefault(require("@core/utils/logger"));
const isDuplicateKeyError = (error) => {
    const err = error;
    return err?.code === 11000;
};
const toUniqueCategoryObjectIds = (categoryIds, deletedCategoryId) => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0)
        return [];
    const deduped = new Map();
    for (const categoryObjectId of categoryIds) {
        const id = String(categoryObjectId);
        if (id === deletedCategoryId)
            continue;
        if (!deduped.has(id)) {
            deduped.set(id, new mongoose_1.default.Types.ObjectId(id));
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
class CatalogOrchestrator {
    /**
     * Invalidate all catalog-swapped caches
     */
    static async invalidateCatalogCache() {
        try {
            await Promise.all([
                (0, redisCache_1.clearCachePattern)('catalog:*'),
                (0, redisCache_1.clearCachePattern)('master:*'),
            ]);
            logger_1.default.info('Catalog cache invalidated (Unified)');
        }
        catch (error) {
            logger_1.default.error('Failed to invalidate catalog cache', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * Cascade Category soft-delete to Brands, Models, and deactivation of Parts
     */
    static async cascadeCategoryDelete(categoryId, session) {
        const txSession = session || null;
        const now = new Date();
        const categoryObjectId = new mongoose_1.default.Types.ObjectId(categoryId);
        const brandIdsToDelete = [];
        // 1) Brands: detach deleted category when other categories exist; soft-delete only true orphans.
        const linkedBrands = await Brand_1.default.find({ categoryIds: categoryObjectId })
            .select('_id categoryIds')
            .session(txSession)
            .lean();
        for (const brand of linkedBrands) {
            const remainingCategoryIds = toUniqueCategoryObjectIds(brand.categoryIds, categoryId);
            if (remainingCategoryIds.length === 0) {
                brandIdsToDelete.push(brand._id);
                continue;
            }
            try {
                await Brand_1.default.updateOne({ _id: brand._id }, { $set: { categoryIds: remainingCategoryIds } }).session(txSession);
            }
            catch (error) {
                // Keep uniqueness intact; if remap collides, safely archive this duplicate branch.
                if (isDuplicateKeyError(error)) {
                    brandIdsToDelete.push(brand._id);
                    continue;
                }
                throw error;
            }
        }
        if (brandIdsToDelete.length > 0) {
            await Brand_1.default.updateMany({ _id: { $in: brandIdsToDelete } }, { $set: { isDeleted: true, isActive: false, deletedAt: now } }).session(txSession);
        }
        // 2) Models: never delete by brand sweep unless brand is actually archived.
        //    Prefer detaching deleted category; soft-delete only if model becomes orphaned.
        const modelOrFilters = [
            { categoryId: categoryObjectId },
            { categoryIds: categoryObjectId },
        ];
        if (brandIdsToDelete.length > 0) {
            modelOrFilters.push({ brandId: { $in: brandIdsToDelete } });
        }
        const affectedModels = await Model_1.default.find({ $or: modelOrFilters })
            .select('_id brandId categoryId categoryIds')
            .session(txSession)
            .lean();
        const modelIdsToDelete = [];
        const deletedBrandIdSet = new Set(brandIdsToDelete.map((id) => String(id)));
        for (const model of affectedModels) {
            if (model.brandId && deletedBrandIdSet.has(String(model.brandId))) {
                modelIdsToDelete.push(model._id);
                continue;
            }
            const remainingCategoryIds = toUniqueCategoryObjectIds(model.categoryIds, categoryId);
            if (remainingCategoryIds.length === 0) {
                modelIdsToDelete.push(model._id);
                continue;
            }
            await Model_1.default.updateOne({ _id: model._id }, { $set: { categoryIds: remainingCategoryIds } }).session(txSession);
        }
        if (modelIdsToDelete.length > 0) {
            await Model_1.default.updateMany({ _id: { $in: modelIdsToDelete } }, { $set: { isDeleted: true, isActive: false, deletedAt: now } }).session(txSession);
        }
        // 3) SpareParts: detach category when possible; soft-delete only if no category remains
        //    or if parent brand is archived by this cascade.
        const sparePartOrFilters = [{ categoryIds: categoryObjectId }];
        if (brandIdsToDelete.length > 0) {
            sparePartOrFilters.push({ brandId: { $in: brandIdsToDelete } });
        }
        const affectedSpareParts = await SparePart_1.default.find({ $or: sparePartOrFilters })
            .select('_id brandId categoryIds')
            .session(txSession)
            .lean();
        const sparePartIdsToDelete = [];
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
            await SparePart_1.default.updateOne({ _id: sparePart._id }, { $set: { categoryIds: remainingCategoryIds } }).session(txSession);
        }
        if (sparePartIdsToDelete.length > 0) {
            await SparePart_1.default.updateMany({ _id: { $in: sparePartIdsToDelete } }, { $set: { isDeleted: true, isActive: false, deletedAt: now } }).session(txSession);
        }
        // 4) ScreenSizes: singular category link; keep cascading delete.
        const screenSizeFilter = brandIdsToDelete.length > 0
            ? { $or: [{ categoryId: categoryObjectId }, { brandId: { $in: brandIdsToDelete } }] }
            : { categoryId: categoryObjectId };
        await ScreenSize_1.default.updateMany(screenSizeFilter, { $set: { isDeleted: true, isActive: false, deletedAt: now } }).session(txSession);
        await this.invalidateCatalogCache();
        logger_1.default.info('Cascaded category delete completed', {
            categoryId,
            brandsArchived: brandIdsToDelete.length,
            modelsArchived: modelIdsToDelete.length,
            sparePartsArchived: sparePartIdsToDelete.length,
        });
    }
    /**
     * Cascade Brand soft-delete to Models
     */
    static async cascadeBrandDelete(brandId, session) {
        await Model_1.default.updateMany({ brandId }, { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }).session(session || null);
        await this.invalidateCatalogCache();
        logger_1.default.info(`Cascaded soft-delete for brand: ${brandId}`);
    }
    /**
     * Create Category with cache invalidation
     */
    static async createCategory(data) {
        const category = new Category_1.default(data);
        const result = await category.save();
        await this.invalidateCatalogCache();
        return result;
    }
    /**
     * Update Category with cache invalidation
     */
    static async updateCategory(id, data) {
        const result = await Category_1.default.findByIdAndUpdate(id, data, { new: true });
        if (result)
            await this.invalidateCatalogCache();
        return result;
    }
    /**
     * Resolve all CategoryIDs from a BrandID
     */
    static async resolveCategoryIdsFromBrand(brandId) {
        const brand = await Brand_1.default.findById(brandId).select('categoryIds').lean();
        if (!brand || !brand.categoryIds)
            return [];
        return brand.categoryIds.map(id => id.toString());
    }
    /**
     * Resolve a single CategoryID from a BrandID (backward compatibility)
     */
    static async resolveCategoryIdFromBrand(brandId) {
        const ids = await this.resolveCategoryIdsFromBrand(brandId);
        return ids.length > 0 ? (ids[0] ?? null) : null;
    }
    /**
     * Detach SpareParts from a specific Model
     */
    static async detachSparePartsFromModel(modelId, session) {
        await SparePart_1.default.updateMany({ modelId }, { $set: { modelId: null, isActive: false } }).session(session || null);
        logger_1.default.info(`Detached spare parts from model: ${modelId}`);
    }
}
exports.CatalogOrchestrator = CatalogOrchestrator;
exports.default = CatalogOrchestrator;
//# sourceMappingURL=CatalogOrchestrator.js.map