import { MongoCategoryRepository } from '../adapters/outbound/database/catalog/MongoCategoryRepository';
import { MongoBrandRepository } from '../adapters/outbound/database/catalog/MongoBrandRepository';
import { CatalogValidationService } from '../services/catalog/CatalogValidationService';

export function createCatalogValidationService(): CatalogValidationService {
    return new CatalogValidationService(
        new MongoCategoryRepository(),
        new MongoBrandRepository()
    );
}
