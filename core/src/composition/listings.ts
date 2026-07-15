import { MongoListingRepositoryAdapter } from '../adapters/outbound/database/listings/MongoListingRepositoryAdapter';
import { MongoListingUnitOfWorkAdapter } from '../adapters/outbound/database/listings/MongoListingUnitOfWorkAdapter';
import { RedisListingsCacheAdapter } from '../adapters/outbound/database/listings/RedisListingsCacheAdapter';
import type { ListingRepositoryPort, ListingUnitOfWorkPort, ListingsCachePort } from '../domains/listings';

let instance: ListingRepositoryPort | null = null;
let uowInstance: ListingUnitOfWorkPort | null = null;
let cacheInstance: ListingsCachePort | null = null;

export function createListingRepository(): ListingRepositoryPort {
    return new MongoListingRepositoryAdapter();
}

export function getListingRepository(): ListingRepositoryPort {
    if (!instance) {
        instance = createListingRepository();
    }
    return instance;
}

export function createListingUnitOfWork(): ListingUnitOfWorkPort {
    return new MongoListingUnitOfWorkAdapter();
}

export function getListingUnitOfWork(): ListingUnitOfWorkPort {
    if (!uowInstance) {
        uowInstance = createListingUnitOfWork();
    }
    return uowInstance;
}

export function createListingsCache(): ListingsCachePort {
    return new RedisListingsCacheAdapter();
}

export function getListingsCache(): ListingsCachePort {
    if (!cacheInstance) {
        cacheInstance = createListingsCache();
    }
    return cacheInstance;
}


