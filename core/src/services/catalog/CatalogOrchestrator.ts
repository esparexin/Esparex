import mongoose from 'mongoose';
import { Category, Brand } from '../../domains/catalog';

// @todo ARCH-118: Transitional types until all consumers are migrated to strict domain models.
export type CategoryResult = Category & Record<string, unknown>;
export type BrandResult = Brand & Record<string, unknown>;

import Model from '../../models/Model';
import SparePart from '../../models/SparePart';
import ScreenSize from '../../models/ScreenSize';
import { clearCachePattern } from '../../utils/redisCache';
import logger from '../../utils/logger';
import { isDuplicateKeyError } from '../../utils/errorHelpers';
import { AppError } from '../../utils/AppError';
import { 
    CatalogUnitOfWorkPort,
    TransactionContext,
    CatalogCachePort,
    CategoryRepositoryPort, 
    BrandRepositoryPort, 
    ModelRepositoryPort, 
    SparePartRepositoryPort 
} from '../../domains/catalog';

type CascadeDoc = {
    _id: mongoose.Types.ObjectId;
    categoryIds?: mongoose.Types.ObjectId[];
    brandId?: mongoose.Types.ObjectId;
};

// isDuplicateKeyError imported from errorHelpers (SSOT)

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
export class CatalogOrchestratorImpl {
    constructor(
        private readonly unitOfWork: CatalogUnitOfWorkPort,
        private readonly cacheService: CatalogCachePort,
        private readonly categoryRepository: CategoryRepositoryPort,
        private readonly brandRepository: BrandRepositoryPort,
        private readonly modelRepository: ModelRepositoryPort,
        private readonly sparePartRepository: SparePartRepositoryPort
    ) {}
    /**
     * Invalidate catalog caches, optionally scoped by category or brand
     */
    async invalidateCatalogCache(opts?: { categoryIds?: (string | mongoose.Types.ObjectId)[], brandIds?: (string | mongoose.Types.ObjectId)[] }) {
        try {
            if (!opts || (!opts.categoryIds?.length && !opts.brandIds?.length)) {
                await Promise.all([
                    clearCachePattern('catalog:*'),
                    clearCachePattern('master:*'),
                ]);
            } else {
                const patterns = new Set<string>();
                
                if (opts.categoryIds) {
                    opts.categoryIds.forEach(id => {
                        const idStr = id.toString();
                        patterns.add(`catalog:brands:${idStr}`);
                        patterns.add(`catalog:models:*category=${idStr}*`);
                        patterns.add(`catalog:spare-parts:${idStr}:*`);
                    });
                }
                
                if (opts.brandIds) {
                    opts.brandIds.forEach(id => {
                        const idStr = id.toString();
                        patterns.add(`catalog:models:*brand=${idStr}*`);
                    });
                }

                // ALWAYS clear "all" caches, because adding a brand/model affects the global unfiltered views
                patterns.add('catalog:brands:all');
                patterns.add('catalog:models:*category=all*');
                patterns.add('catalog:spare-parts:all:*');
                patterns.add('catalog:counts:*');

                await Promise.all(Array.from(patterns).map(p => clearCachePattern(p)));
            }
            logger.info('Catalog cache invalidated', { opts });
        } catch (error) {
            logger.error('Failed to invalidate catalog cache', { 
                error: error instanceof Error ? error.message : String(error) 
            });
        }
    }

    /**
     * Cascade Category soft-delete to Brands, Models, and deactivation of Parts
     */
    async cascadeCategoryDelete(categoryId: string, session?: TransactionContext) {
        const txSession = session || null;
        const now = new Date();
        const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
        const brandIdsToDelete: mongoose.Types.ObjectId[] = [];

        // 1) Brands: detach deleted category when other categories exist; soft-delete only true orphans.
        const linkedBrands = await this.brandRepository.findByCategory(categoryId, txSession);

        for (const brand of linkedBrands) {
            const remainingCategoryIds = toUniqueCategoryObjectIds(brand.categoryIds as any, categoryId);
            if (remainingCategoryIds.length === 0) {
                brandIdsToDelete.push(new mongoose.Types.ObjectId(brand.id));
                continue;
            }

            try {
                await this.brandRepository.updateCategoryIds(brand.id, remainingCategoryIds.map(id => String(id)), txSession);
            } catch (error) {
                // Keep uniqueness intact; if remap collides, safely archive this duplicate branch.
                if (isDuplicateKeyError(error)) {
                    brandIdsToDelete.push(new mongoose.Types.ObjectId(brand.id));
                    continue;
                }
                throw error;
            }
        }

        if (brandIdsToDelete.length > 0) {
            await this.brandRepository.softDeleteMany(brandIdsToDelete.map(id => String(id)), txSession);
        }

        // 2) Models: never delete by brand sweep unless brand is actually archived.
        //    Prefer detaching deleted category; soft-delete only if model becomes orphaned.
        const modelOrFilters: Array<Record<string, unknown>> = [{ categoryIds: categoryObjectId }];
        if (brandIdsToDelete.length > 0) {
            modelOrFilters.push({ brandId: { $in: brandIdsToDelete } });
        }

        const affectedModels = await Model.find({ $or: modelOrFilters })
            .select('_id brandId categoryIds')
            .session(txSession as any)
            .lean<CascadeDoc[]>();

        const modelIdsToDelete: mongoose.Types.ObjectId[] = [];
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

            await Model.updateOne(
                { _id: model._id },
                { $set: { categoryIds: remainingCategoryIds } }
            ).session(txSession as any);
        }

        if (modelIdsToDelete.length > 0) {
            await Model.updateMany(
                { _id: { $in: modelIdsToDelete } },
                { $set: { isDeleted: true, isActive: false, deletedAt: now } }
            ).session(txSession as any);
        }

        // 3) SpareParts: detach category when possible; soft-delete only if no category remains
        //    or if parent brand is archived by this cascade.
        const sparePartOrFilters: Array<Record<string, unknown>> = [{ categoryIds: categoryObjectId }];
        if (brandIdsToDelete.length > 0) {
            sparePartOrFilters.push({ brandId: { $in: brandIdsToDelete } });
        }

        const affectedSpareParts = await SparePart.find({ $or: sparePartOrFilters })
            .select('_id brandId categoryIds')
            .session(txSession as any)
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
            ).session(txSession as any);
        }

        if (sparePartIdsToDelete.length > 0) {
            await SparePart.updateMany(
                { _id: { $in: sparePartIdsToDelete } },
                { $set: { isDeleted: true, isActive: false, deletedAt: now } }
            ).session(txSession as any);
        }

        // 4) ScreenSizes: singular category link; keep cascading delete.
        const screenSizeFilter = brandIdsToDelete.length > 0
            ? { $or: [{ categoryId: categoryObjectId }, { brandId: { $in: brandIdsToDelete } }] }
            : { categoryId: categoryObjectId };
        await ScreenSize.updateMany(
            screenSizeFilter,
            { $set: { isDeleted: true, isActive: false, deletedAt: now } }
        ).session(txSession as any);

        await this.invalidateCatalogCache({ categoryIds: [categoryId], brandIds: brandIdsToDelete });
        logger.info('Cascaded category delete completed', {
            categoryId,
            brandsArchived: brandIdsToDelete.length,
            modelsArchived: modelIdsToDelete.length,
            sparePartsArchived: sparePartIdsToDelete.length,
        });
    }

    /**
     * Cascade Brand soft-delete to Models and SpareParts
     */
    async cascadeBrandDelete(brandId: string, session?: TransactionContext) {
        const txSession = session || null;
        const now = new Date();

        // Find all models associated with this brand
        const models = await Model.find({ brandId })
            .select('_id')
            .session(txSession as any)
            .lean<CascadeDoc[]>();
        const modelIds = models.map((m) => m._id);

        // Soft-delete those Models
        const modelRes = await Model.updateMany(
            { brandId },
            { $set: { isDeleted: true, isActive: false, deletedAt: now } }
        ).session(txSession as any);

        let deletedSpareParts = 0;
        // Soft-delete SpareParts linked to those models
        if (modelIds.length > 0) {
            const spRes1 = await SparePart.updateMany(
                { modelId: { $in: modelIds } },
                { $set: { isDeleted: true, isActive: false, deletedAt: now } }
            ).session(txSession as any);
            deletedSpareParts += spRes1.modifiedCount || 0;
        }

        // Soft-delete SpareParts linked to the brand directly
        const spRes2 = await SparePart.updateMany(
            { brandId },
            { $set: { isDeleted: true, isActive: false, deletedAt: now } }
        ).session(txSession as any);
        deletedSpareParts += spRes2.modifiedCount || 0;

        await this.invalidateCatalogCache({ brandIds: [brandId] });
        logger.info(`Cascaded soft-delete for brand: ${brandId}`);

        return {
            deletedModels: modelRes.modifiedCount || 0,
            deletedSpareParts
        };
    }

    /**
     * Create Category with cache invalidation
     */
    async createCategory(data: CategoryResult): Promise<CategoryResult> {
        const result = await this.categoryRepository.create(data);
        await this.invalidateCatalogCache({ categoryIds: [result.id] });
        return result as CategoryResult;
    }

    /**
     * Update Category with cache invalidation
     */
    async updateCategory(id: string, data: CategoryResult): Promise<CategoryResult | null> {
        const result = await this.categoryRepository.update(id, data);
        if (result) await this.invalidateCatalogCache({ categoryIds: [id] });
        return result as CategoryResult;
    }


    /**
     * Resolve all CategoryIDs from a BrandID
     */
    async resolveCategoryIdsFromBrand(brandId: string): Promise<string[]> {
        const brand = await this.brandRepository.findById(brandId);
        if (!brand || !brand.categoryIds) return [];
        return brand.categoryIds.map(id => String(id));
    }

    /**
     * Resolve a deterministic primary CategoryID from a BrandID.
     */
    async resolvePrimaryCategoryIdFromBrand(brandId: string): Promise<string | null> {
        const ids = await this.resolveCategoryIdsFromBrand(brandId);
        return ids.length > 0 ? (ids[0] ?? null) : null;
    }

    /**
     * Detach SpareParts from a specific Model
     */
    async detachSparePartsFromModel(modelId: string, session?: TransactionContext) {
        await SparePart.updateMany(
            { modelId },
            { $set: { modelId: null, isActive: false } }
        ).session(session as any || null);
        
        logger.info(`Detached spare parts from model: ${modelId}`);
    }

    async deleteCategoryOrchestrated(categoryId: string): Promise<CategoryResult> {
        return this.unitOfWork.executeTransaction(async (txSession) => {
            const category = await this.categoryRepository.findById(categoryId, txSession);

            if (!category) {
                throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
            }

            await this.categoryRepository.softDelete(categoryId, txSession);
            await this.cascadeCategoryDelete(categoryId, txSession);

            return await this.categoryRepository.findById(categoryId, txSession) as CategoryResult;
        });
    }

    async deleteBrandOrchestrated(brandId: string) {
        const existingBrand = await this.brandRepository.findById(brandId, true);
        if (!existingBrand || existingBrand.isDeleted) {
            return { brandId, deletedModels: 0, deletedSpareParts: 0, alreadyDeleted: true };
        }

        const { checkBrandDependencies } = require('../../services/catalog/CatalogBrandModelService');
        const deps = await checkBrandDependencies(brandId);
        if (deps.count > 0) {
            throw new AppError('Brand cannot be deleted because dependencies exist', 409, 'DEPENDENCIES_EXIST', deps.details);
        }

        return this.unitOfWork.executeTransaction(async (txSession) => {
            const brand = txSession 
                ? await this.brandRepository.softDelete(brandId, txSession)
                : await this.brandRepository.softDelete(brandId);

            if (!brand) return { deletedModels: 0, deletedSpareParts: 0, brand: null };
            const cascadeRes = await this.cascadeBrandDelete(brandId, txSession ?? undefined);
            return { brandId, deletedModels: cascadeRes.deletedModels, deletedSpareParts: cascadeRes.deletedSpareParts, alreadyDeleted: false };
        });
    }
}

let serviceInstance: CatalogOrchestratorImpl | null = null;

export function initializeCatalogOrchestrator(instance: CatalogOrchestratorImpl) {
    serviceInstance = instance;
}

function getServiceInstance(): CatalogOrchestratorImpl {
    if (!serviceInstance) {
        const { MongoCatalogUnitOfWorkAdapter } = require('../../adapters/outbound/database/catalog/MongoCatalogUnitOfWorkAdapter');
        const { RedisCatalogCacheAdapter } = require('../../adapters/outbound/database/catalog/RedisCatalogCacheAdapter');
        const { MongoCategoryRepositoryAdapter } = require('../../adapters/outbound/database/catalog/MongoCategoryRepositoryAdapter');
        const { MongoBrandRepositoryAdapter } = require('../../adapters/outbound/database/catalog/MongoBrandRepositoryAdapter');
        const { MongoModelRepositoryAdapter } = require('../../adapters/outbound/database/catalog/MongoModelRepositoryAdapter');
        const { MongoSparePartRepositoryAdapter } = require('../../adapters/outbound/database/catalog/MongoSparePartRepositoryAdapter');

        serviceInstance = new CatalogOrchestratorImpl(
            new MongoCatalogUnitOfWorkAdapter(),
            new RedisCatalogCacheAdapter(),
            new MongoCategoryRepositoryAdapter(),
            new MongoBrandRepositoryAdapter(),
            new MongoModelRepositoryAdapter(),
            new MongoSparePartRepositoryAdapter()
        );
    }
    return serviceInstance;
}

export class CatalogOrchestrator {
    private static get instance() { return getServiceInstance(); }

    static async invalidateCatalogCache(opts?: { categoryIds?: (string | mongoose.Types.ObjectId)[], brandIds?: (string | mongoose.Types.ObjectId)[] }) {
        return this.instance.invalidateCatalogCache(opts);
    }
    static async cascadeCategoryDelete(categoryId: string, session?: TransactionContext) {
        return this.instance.cascadeCategoryDelete(categoryId, session);
    }
    static async cascadeBrandDelete(brandId: string, session?: TransactionContext) {
        return this.instance.cascadeBrandDelete(brandId, session);
    }
    static async createCategory(data: CategoryResult): Promise<CategoryResult> {
        return this.instance.createCategory(data);
    }
    static async updateCategory(id: string, data: CategoryResult): Promise<CategoryResult | null> {
        return this.instance.updateCategory(id, data);
    }
    static async resolveCategoryIdsFromBrand(brandId: string): Promise<string[]> {
        return this.instance.resolveCategoryIdsFromBrand(brandId);
    }
    static async resolvePrimaryCategoryIdFromBrand(brandId: string): Promise<string | null> {
        return this.instance.resolvePrimaryCategoryIdFromBrand(brandId);
    }
    static async detachSparePartsFromModel(modelId: string, session?: TransactionContext) {
        return this.instance.detachSparePartsFromModel(modelId, session);
    }
    static async deleteCategoryOrchestrated(categoryId: string) {
        return this.instance.deleteCategoryOrchestrated(categoryId);
    }
    static async deleteBrandOrchestrated(brandId: string) {
        return this.instance.deleteBrandOrchestrated(brandId);
    }
}

export default CatalogOrchestrator;
