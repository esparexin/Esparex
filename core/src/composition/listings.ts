import { MongoListingRepositoryAdapter } from '../adapters/outbound/database/listings/MongoListingRepositoryAdapter';
import { MongoListingUnitOfWorkAdapter } from '../adapters/outbound/database/listings/MongoListingUnitOfWorkAdapter';
import type { ListingRepositoryPort, ListingUnitOfWorkPort } from '../domains/listings';

let instance: ListingRepositoryPort | null = null;
let uowInstance: ListingUnitOfWorkPort | null = null;

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

