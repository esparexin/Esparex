import type { ListingTypeValue, AdStatusValue } from '@esparex/contracts';

// ─── Domain Types ───────────────────────────────────────────────────────────

export type ListingId = string;

export interface ListingLocation {
    readonly coordinates: [number, number];
    readonly city?: string;
    readonly state?: string;
    readonly country?: string;
    readonly display?: string;
    readonly locationId?: string;
}

/**
 * Domain Listing entity — lean, contains only fields commonly accessed
 * by application services. Expand as new services are migrated.
 */
export interface Listing {
    readonly id: ListingId;
    readonly title: string;
    readonly description: string;
    readonly price: number;
    readonly listingType: ListingTypeValue;
    readonly sellerId: ListingId;
    readonly status: AdStatusValue;
    readonly categoryId: ListingId;
    readonly brandId?: ListingId;
    readonly modelId?: ListingId;
    readonly locationPath?: readonly string[];
    readonly images: readonly string[];
    readonly seoSlug?: string;
    readonly location: ListingLocation;
    readonly isDeleted: boolean;
    readonly isSold: boolean;
    readonly moderationStatus?: string;
    readonly fraudScore?: number;
    readonly sellerTrustSnapshot?: number;
    readonly isSpotlight?: boolean;
    readonly spotlightExpiresAt?: Date;
    readonly expiresAt?: Date;
    readonly views?: {
        readonly total?: number;
        readonly unique?: number;
        readonly favorites?: number;
        readonly lastViewedAt?: Date;
    };
    readonly reviewVersion?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly [key: string]: unknown;
}

// ─── Filter Types ───────────────────────────────────────────────────────────

export interface ActiveListingCountFilter {
    sellerId: string;
    listingType: ListingTypeValue;
    status?: AdStatusValue;
    session?: unknown;
}

export interface ListingFilter {
    session?: unknown;
    _id?: string | { $ne: string } | unknown;
    sellerId?: string | { $ne: string };
    listingType?: ListingTypeValue;
    status?: AdStatusValue | { $in: AdStatusValue[] };
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    price?: { $gte: number; $lte: number } | number;
    imageHashes?: { $in: string[] };
    duplicateFingerprint?: string;
    isDeleted?: boolean | { $ne: boolean };
    isSold?: boolean;
    ids?: readonly string[];
    idsNotIn?: readonly string[];
    excludeStatus?: AdStatusValue[];
    searchText?: string;
    locationId?: string;
    locationCity?: string | { $regex: string; $options?: string };
    locationState?: string | { $in: (string | RegExp)[] } | { $regex: string; $options?: string } | RegExp;
    locationPath?: string;
    isSpotlight?: boolean | { $ne: boolean };
    spotlightExpiresAt?: { $lt?: Date; $gt?: Date; $lte?: Date; $exists?: boolean } | null;
    expiresAt?: { $lte?: Date; $lt?: Date };
    sparePartIds?: string;
    favoritesGreaterThan?: number;
    moderationStatus?: string | { $nin?: readonly string[]; $in?: readonly string[] };
    $or?: Record<string, unknown>[];
    cursorCreatedAt?: Date;
    cursorId?: string;
    [key: string]: unknown;
}

export interface ListingUpdate {
    status?: AdStatusValue;
    title?: string;
    description?: string;
    price?: number;
    location?: ListingLocation;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    images?: readonly string[];
    seoSlug?: string;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    isSpotlight?: boolean;
    isChatLocked?: boolean;
    isSold?: boolean;
    soldAt?: Date;
    soldReason?: string;
    sellerTrustSnapshot?: number;
    expiredAt?: Date;
    expiryWarningSentAt?: Date;
    expiryWarningCount?: number;
    spotlightWarningSentAt?: Date;
    spotlightWarningCount?: number;
    lastExpiryWarningChannel?: string;
    approvalStatus?: string;
    moderationStatus?: string;
    [key: string]: unknown;
}

export interface PaginationInput {
    readonly limit: number;
    readonly offset: number;
}

export interface PaginatedResult<T> {
    readonly data: readonly T[];
    readonly total: number;
}

// ─── Port Interface ─────────────────────────────────────────────────────────
// Start minimal. Add methods only when a new service requires them.

export interface ListingRepositoryPort {
    /** Count active listings for a seller by type */
    countActiveBySeller(filter: ActiveListingCountFilter): Promise<number>;

    /** Count listings matching a filter */
    count(filter: ListingFilter): Promise<number>;

    /** Find a single listing by ID */
    findById(id: string): Promise<Listing | null>;

    /** Find listings matching a filter */
    find(filter: ListingFilter): Promise<readonly Listing[]>;

    /** Find listings matching a filter with optional sorting and limiting */
    findWithLimit(filter: ListingFilter, sort?: Record<string, 1 | -1>, limit?: number, skip?: number): Promise<readonly Listing[]>;

    /** Find a single listing matching a filter */
    findOne(filter: ListingFilter): Promise<Listing | null>;

    /** Insert a single new listing */
    insert(listing: ListingUpdate, session?: unknown): Promise<Listing>;

    /** Update one listing by ID */
    updateOne(id: string, update: ListingUpdate, session?: unknown): Promise<Listing | null>;

    /** Update a single listing matching a filter and return the updated entity */
    updateOneByFilter(filter: ListingFilter, update: ListingUpdate, session?: unknown): Promise<Listing | null>;

    /** Update multiple listings matching a filter */
    updateMany(filter: ListingFilter, update: ListingUpdate, session?: unknown): Promise<number>;
    /**
     * Search listings within a geographic radius (uses $near or equivalent spatial query)
     */
    findWithinRadius(
        lng: number,
        lat: number,
        radiusKm: number,
        filter: ListingFilter,
        sort?: Record<string, 1 | -1>,
        limit?: number,
        skip?: number
    ): Promise<Listing[]>;
}
