import { MongoCategoryRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoCategoryRepositoryAdapter';
import { MongoBrandRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoBrandRepositoryAdapter';
import { MongoModelRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoModelRepositoryAdapter';
import { MongoSparePartRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoSparePartRepositoryAdapter';
import { MongoScreenSizeRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoScreenSizeRepositoryAdapter';
import { MongoCatalogUnitOfWorkAdapter } from '../adapters/outbound/database/catalog/MongoCatalogUnitOfWorkAdapter';
import { RedisCatalogCacheAdapter } from '../adapters/outbound/database/catalog/RedisCatalogCacheAdapter';
import { CatalogValidationService } from '../services/catalog/CatalogValidationService';
import { CatalogOrchestratorImpl } from '../services/catalog/CatalogOrchestrator';

export const categoryRepository = new MongoCategoryRepositoryAdapter();
export const brandRepository = new MongoBrandRepositoryAdapter();
export const modelRepository = new MongoModelRepositoryAdapter();
export const sparePartRepository = new MongoSparePartRepositoryAdapter();
export const screenSizeRepository = new MongoScreenSizeRepositoryAdapter();
export const catalogUnitOfWork = new MongoCatalogUnitOfWorkAdapter();
export const catalogCache = new RedisCatalogCacheAdapter();

export function createCatalogValidationService(): CatalogValidationService {
    return new CatalogValidationService(
        categoryRepository,
        brandRepository,
        modelRepository,
        sparePartRepository
    );
}

export function createCatalogOrchestrator(): CatalogOrchestratorImpl {
    return new CatalogOrchestratorImpl(
        catalogUnitOfWork,
        catalogCache,
        categoryRepository,
        brandRepository,
        modelRepository,
        sparePartRepository,
        screenSizeRepository
    );
}
