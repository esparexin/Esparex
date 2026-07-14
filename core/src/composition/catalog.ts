import { MongoCategoryRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoCategoryRepositoryAdapter';
import { MongoBrandRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoBrandRepositoryAdapter';
import { MongoModelRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoModelRepositoryAdapter';
import { MongoSparePartRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoSparePartRepositoryAdapter';
import { CatalogValidationService } from '../services/catalog/CatalogValidationService';

export function createCatalogValidationService(): CatalogValidationService {
    return new CatalogValidationService(
        new MongoCategoryRepositoryAdapter(),
        new MongoBrandRepositoryAdapter(),
        new MongoModelRepositoryAdapter(),
        new MongoSparePartRepositoryAdapter()
    );
}
