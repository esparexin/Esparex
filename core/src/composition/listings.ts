import { MongoListingRepositoryAdapter } from '../adapters/outbound/database/listings/MongoListingRepositoryAdapter';
import type { ListingRepositoryPort } from '../domains/listings';

let instance: ListingRepositoryPort | null = null;

export function createListingRepository(): ListingRepositoryPort {
    return new MongoListingRepositoryAdapter();
}

export function getListingRepository(): ListingRepositoryPort {
    if (!instance) {
        instance = createListingRepository();
    }
    return instance;
}
