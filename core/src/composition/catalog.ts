import { MongoSparePartRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoSparePartRepositoryAdapter';
import { MongoBrandRepositoryAdapter } from '../adapters/outbound/database/catalog/MongoBrandRepositoryAdapter';
import type { SparePartRepositoryPort } from '../domains/catalog/ports/SparePartRepositoryPort';
import type { BrandRepositoryPort } from '../domains/catalog/ports/BrandRepositoryPort';

let sparePartInstance: SparePartRepositoryPort | null = null;
let brandInstance: BrandRepositoryPort | null = null;

export function createSparePartRepository(): SparePartRepositoryPort {
    return new MongoSparePartRepositoryAdapter();
}

export function getSparePartRepository(): SparePartRepositoryPort {
    if (!sparePartInstance) {
        sparePartInstance = createSparePartRepository();
    }
    return sparePartInstance;
}

export function createBrandRepository(): BrandRepositoryPort {
    return new MongoBrandRepositoryAdapter();
}

export function getBrandRepository(): BrandRepositoryPort {
    if (!brandInstance) {
        brandInstance = createBrandRepository();
    }
    return brandInstance;
}
