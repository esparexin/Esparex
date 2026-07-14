import { MongoCategoryRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoCategoryRepositoryAdapter';
import { MongoBrandRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoBrandRepositoryAdapter';
import { MongoModelRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoModelRepositoryAdapter';
import { MongoSparePartRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoSparePartRepositoryAdapter';
import { MongoScreenSizeRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoScreenSizeRepositoryAdapter';
import { MongoCatalogUnitOfWorkAdapter } from '../adapters/outbound/database/catalog/MongoCatalogUnitOfWorkAdapter';
import { RedisCatalogCacheAdapter } from '../adapters/outbound/database/catalog/RedisCatalogCacheAdapter';
import { CatalogValidationService } from '../services/catalog/CatalogValidationService';
import { CatalogOrchestratorImpl } from '../services/catalog/CatalogOrchestrator';

export function createCatalogValidationService(): CatalogValidationService {
    return new CatalogValidationService(
        new MongoCategoryRepositoryAdapter(),
        new MongoBrandRepositoryAdapter(),
        new MongoModelRepositoryAdapter(),
        new MongoSparePartRepositoryAdapter()
    );
}

export function createCatalogOrchestrator(): CatalogOrchestratorImpl {
    return new CatalogOrchestratorImpl(
        new MongoCatalogUnitOfWorkAdapter(),
        new RedisCatalogCacheAdapter(),
        new MongoCategoryRepositoryAdapter(),
        new MongoBrandRepositoryAdapter(),
        new MongoModelRepositoryAdapter(),
        new MongoSparePartRepositoryAdapter(),
        new MongoScreenSizeRepositoryAdapter()
    );
}
