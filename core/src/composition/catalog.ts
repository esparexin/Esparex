/**
 * ESPAREX — composition/catalog.ts
 *
 * Composition root for the catalog domain (P1-8, DECISION-GATE §2).
 * Backend data paths (seeds, admin catalog controllers) resolve catalog
 * persistence ONLY through these repository ports — never via direct
 * `@esparex/core/models/*` imports.
 */
import { MongoBrandRepositoryAdapter } from '../domains/catalog/adapters/outbound/database/MongoBrandRepositoryAdapter';
import { MongoCategoryRepositoryAdapter } from '../domains/catalog/adapters/outbound/database/MongoCategoryRepositoryAdapter';
import { MongoModelRepositoryAdapter } from '../domains/catalog/adapters/outbound/database/MongoModelRepositoryAdapter';
import { MongoScreenSizeRepositoryAdapter } from '../domains/catalog/adapters/outbound/database/MongoScreenSizeRepositoryAdapter';
import { MongoServiceTypeRepositoryAdapter } from '../domains/catalog/adapters/outbound/database/MongoServiceTypeRepositoryAdapter';
import { MongoSparePartRepositoryAdapter } from '../domains/catalog/adapters/outbound/database/MongoSparePartRepositoryAdapter';
import type {
    BrandRepositoryPort,
    CategoryRepositoryPort,
    ModelRepositoryPort,
    ScreenSizeRepositoryPort,
    ServiceTypeRepositoryPort,
    SparePartRepositoryPort,
} from '../domains/catalog';

const instances: {
    brand?: BrandRepositoryPort;
    category?: CategoryRepositoryPort;
    model?: ModelRepositoryPort;
    screenSize?: ScreenSizeRepositoryPort;
    serviceType?: ServiceTypeRepositoryPort;
    sparePart?: SparePartRepositoryPort;
} = {};

export function getBrandRepository(): BrandRepositoryPort {
    if (!instances.brand) instances.brand = new MongoBrandRepositoryAdapter();
    return instances.brand;
}

export function getCategoryRepository(): CategoryRepositoryPort {
    if (!instances.category) instances.category = new MongoCategoryRepositoryAdapter();
    return instances.category;
}

export function getModelRepository(): ModelRepositoryPort {
    if (!instances.model) instances.model = new MongoModelRepositoryAdapter();
    return instances.model;
}

export function getScreenSizeRepository(): ScreenSizeRepositoryPort {
    if (!instances.screenSize) instances.screenSize = new MongoScreenSizeRepositoryAdapter();
    return instances.screenSize;
}

export function getServiceTypeRepository(): ServiceTypeRepositoryPort {
    if (!instances.serviceType) instances.serviceType = new MongoServiceTypeRepositoryAdapter();
    return instances.serviceType;
}

export function getSparePartRepository(): SparePartRepositoryPort {
    if (!instances.sparePart) instances.sparePart = new MongoSparePartRepositoryAdapter();
    return instances.sparePart;
}
