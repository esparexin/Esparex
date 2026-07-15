// ── Ports ──
export {
    type ListingId,
    type Listing,
    type ListingLocation,
    type ActiveListingCountFilter,
    type ListingFilter,
    type ListingUpdate,
    type PaginationInput,
    type PaginatedResult,
    ListingRepositoryPort,
} from './ports/ListingRepositoryPort';

export {
    type TransactionContext,
    ListingUnitOfWorkPort,
} from './ports/ListingUnitOfWorkPort';

export { ListingsCachePort } from './ports/ListingsCachePort';


