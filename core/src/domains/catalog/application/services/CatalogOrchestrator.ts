import { Category, Brand } from '../..';

// @todo ARCH-118: Transitional types until all consumers are migrated to strict domain models.
export type CategoryResult = Category & Record<string, unknown>;
export type BrandResult = Brand & Record<string, unknown>;


import logger from '../../../../utils/logger';
import { isDuplicateKeyError } from '../../../../utils/errorHelpers';
import { AppError } from '../../../../utils/AppError';
import { 
    CatalogUnitOfWorkPort,
    TransactionContext,
    CatalogCachePort,
    CategoryRepositoryPort, 
    BrandRepositoryPort, 
    ModelRepositoryPort, 
    SparePartRepositoryPort,
    ScreenSizeRepositoryPort
} from '../..';

// isDuplicateKeyError imported from errorHelpers (SSOT)

const toUniqueCategoryIds = (
    categoryIds: readonly string[] | undefined,
    deletedCategoryId: string
): string[] => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) return [];
    const deduped = new Set<string>();
    for (const categoryId of categoryIds) {
        const id = String(categoryId);
        if (id === deletedCategoryId) continue;
        deduped.add(id);
    }
    return Array.from(deduped);
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
        private readonly sparePartRepository: SparePartRepositoryPort,
        private readonly screenSizeRepository: ScreenSizeRepositoryPort
    ) {}
    /**
     * Invalidate catalog caches, optionally scoped by category or brand
     */
    async invalidateCatalogCache(opts?: { categoryIds?: any[], brandIds?: any[] }) {
        const cleanOpts = opts ? {
            categoryIds: opts.categoryIds ? opts.categoryIds.map(id => String(id)) : undefined,
            brandIds: opts.brandIds ? opts.brandIds.map(id => String(id)) : undefined
        } : undefined;
        await this.cacheService.invalidateCatalogCache(cleanOpts);
    }

    /**
     * Cascade Category soft-delete to Brands, Models, and deactivation of Parts
     */
    async cascadeCategoryDelete(categoryId: string, session?: TransactionContext) {
        const txSession = session || null;
        const brandIdsToDelete: string[] = [];

        // 1) Brands: detach deleted category when other categories exist; soft-delete only true orphans.
        const linkedBrands = await this.brandRepository.findByCategory(categoryId, txSession);

        for (const brand of linkedBrands) {
            const remainingCategoryIds = toUniqueCategoryIds(brand.categoryIds, categoryId);
            if (remainingCategoryIds.length === 0) {
                brandIdsToDelete.push(brand.id);
                continue;
            }

            try {
                await this.brandRepository.updateCategoryIds(brand.id, remainingCategoryIds, txSession);
            } catch (error) {
                // Keep uniqueness intact; if remap collides, safely archive this duplicate branch.
                if (isDuplicateKeyError(error)) {
                    brandIdsToDelete.push(brand.id);
                    continue;
                }
                throw error;
            }
        }

        if (brandIdsToDelete.length > 0) {
            await this.brandRepository.softDeleteMany(brandIdsToDelete, txSession);
        }

        // 2) Models: never delete by brand sweep unless brand is actually archived.
        //    Prefer detaching deleted category; soft-delete only if model becomes orphaned.
        const affectedModels = await this.modelRepository.findByCategoryOrBrands(categoryId, brandIdsToDelete, txSession);

        const modelIdsToDelete: string[] = [];
        const deletedBrandIdSet = new Set(brandIdsToDelete);

        for (const model of affectedModels) {
            if (model.brandId && deletedBrandIdSet.has(model.brandId)) {
                modelIdsToDelete.push(model.id);
                continue;
            }

            const remainingCategoryIds = toUniqueCategoryIds(model.categoryIds, categoryId);
            
            if (remainingCategoryIds.length === 0) {
                modelIdsToDelete.push(model.id);
                continue;
            }

            await this.modelRepository.updateCategoryIds(model.id, remainingCategoryIds, txSession);
        }

        if (modelIdsToDelete.length > 0) {
            await this.modelRepository.softDeleteMany(modelIdsToDelete, txSession);
        }

        // 3) SpareParts: detach category when possible; soft-delete only if no category remains
        //    or if parent brand is archived by this cascade.
        const affectedSpareParts = await this.sparePartRepository.findByCategoryOrBrands(categoryId, brandIdsToDelete, txSession);

        const sparePartIdsToDelete: string[] = [];
        for (const sparePart of affectedSpareParts) {
            if (sparePart.brandId && deletedBrandIdSet.has(sparePart.brandId)) {
                sparePartIdsToDelete.push(sparePart.id);
                continue;
            }

            const remainingCategoryIds = toUniqueCategoryIds(sparePart.categoryIds, categoryId);
            if (remainingCategoryIds.length === 0) {
                sparePartIdsToDelete.push(sparePart.id);
                continue;
            }

            await this.sparePartRepository.updateCategoryIds(sparePart.id, remainingCategoryIds, txSession);
        }

        if (sparePartIdsToDelete.length > 0) {
            await this.sparePartRepository.softDeleteMany(sparePartIdsToDelete, txSession);
        }

        // 4) ScreenSizes: singular category link; keep cascading delete.
        await this.screenSizeRepository.softDeleteByCriteria(
            { categoryId, brandIds: brandIdsToDelete },
            txSession
        );

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

        // Find all models associated with this brand
        const models = await this.modelRepository.findByBrandId(brandId, txSession);
        const modelIds = models.map((m) => m.id);

        // Soft-delete those Models
        const deletedModels = await this.modelRepository.softDeleteByBrandId(brandId, txSession);

        let deletedSpareParts = 0;
        // Soft-delete SpareParts linked to those models
        if (modelIds.length > 0) {
            const count1 = await this.sparePartRepository.softDeleteByModelIds(modelIds, txSession);
            deletedSpareParts += count1;
        }

        // Soft-delete SpareParts linked to the brand directly
        const count2 = await this.sparePartRepository.softDeleteByBrandId(brandId, txSession);
        deletedSpareParts += count2;

        await this.invalidateCatalogCache({ brandIds: [brandId] });
        logger.info(`Cascaded soft-delete for brand: ${brandId}`);

        return {
            deletedModels,
            deletedSpareParts
        };
    }

    /**
     * Create Category with cache invalidation
     */
    async createCategory(data: any): Promise<CategoryResult> {
        const result = await this.categoryRepository.create(data);
        await this.invalidateCatalogCache({ categoryIds: [result.id] });
        return result as CategoryResult;
    }

    /**
     * Update Category with cache invalidation
     */
    async updateCategory(id: string, data: any): Promise<CategoryResult | null> {
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
        await this.sparePartRepository.clearModelReferences(modelId, session);
        
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

        const { checkBrandDependencies } = require('./CatalogBrandModelService');
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
        const { MongoCatalogUnitOfWorkAdapter } = require('../../adapters/outbound/database/MongoCatalogUnitOfWorkAdapter');
        const { RedisCatalogCacheAdapter } = require('../../adapters/outbound/database/RedisCatalogCacheAdapter');
        const { MongoCategoryRepositoryAdapter } = require('../../adapters/outbound/database/MongoCategoryRepositoryAdapter');
        const { MongoBrandRepositoryAdapter } = require('../../adapters/outbound/database/MongoBrandRepositoryAdapter');
        const { MongoModelRepositoryAdapter } = require('../../adapters/outbound/database/MongoModelRepositoryAdapter');
        const { MongoSparePartRepositoryAdapter } = require('../../adapters/outbound/database/MongoSparePartRepositoryAdapter');

        const { MongoScreenSizeRepositoryAdapter } = require('../../adapters/outbound/database/MongoScreenSizeRepositoryAdapter');

        serviceInstance = new CatalogOrchestratorImpl(
            new MongoCatalogUnitOfWorkAdapter(),
            new RedisCatalogCacheAdapter(),
            new MongoCategoryRepositoryAdapter(),
            new MongoBrandRepositoryAdapter(),
            new MongoModelRepositoryAdapter(),
            new MongoSparePartRepositoryAdapter(),
            new MongoScreenSizeRepositoryAdapter()
        );
    }
    return serviceInstance;
}

export class CatalogOrchestrator {
    private static get instance() { return getServiceInstance(); }

    static async invalidateCatalogCache(opts?: { categoryIds?: any[], brandIds?: any[] }) {
        return this.instance.invalidateCatalogCache(opts);
    }
    static async cascadeCategoryDelete(categoryId: string, session?: TransactionContext) {
        return this.instance.cascadeCategoryDelete(categoryId, session);
    }
    static async cascadeBrandDelete(brandId: string, session?: TransactionContext) {
        return this.instance.cascadeBrandDelete(brandId, session);
    }
    static async createCategory(data: any): Promise<CategoryResult> {
        return this.instance.createCategory(data);
    }
    static async updateCategory(id: string, data: any): Promise<CategoryResult | null> {
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
