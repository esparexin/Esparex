import type { Listing } from '..';

// ─── Listing mapper (P3 extract-before-split from MongoListingRepositoryAdapter,
// P8 moved to domains/listings/mappers per mapper-ownership + adapter naming rule) ─
// Mappers own DTO/domain transformations; repositories never map (AGENTS.md).

export type DbListing = {
    _id: unknown;
    title: string;
    description: string;
    price: number;
    listingType: string;
    sellerId: unknown;
    status: string;
    categoryId: unknown;
    brandId?: unknown;
    modelId?: unknown;
    locationPath?: unknown[];
    images?: string[];
    seoSlug?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
        display?: string;
        coordinates?: { coordinates?: [number, number] };
        locationId?: unknown;
    };
    isDeleted?: boolean;
    isSold?: boolean;
    moderationStatus?: string;
    fraudScore?: number;
    sellerTrustSnapshot?: number;
    sellerPriorityScore?: number;
    isSpotlight?: boolean;
    // IAd fields: present in Mongoose schema, added for DTO parity with browse pipeline
    sellerType?: 'user' | 'business';
    businessId?: unknown;
    deviceCondition?: 'power_on' | 'power_off';
    sparePartIds?: unknown[];
    spareParts?: unknown[];
    sparePartsSnapshot?: Array<{
        _id: unknown;
        name: string;
        brand?: string;
    }>;
    serviceTypeIds?: unknown[];
    sparePartId?: unknown;
    priceMin?: number;
    priceMax?: number;
    diagnosticFee?: number;
    onsiteService?: boolean;

    spotlightExpiresAt?: Date;
    expiresAt?: Date;
    views?: {
        total?: number;
        unique?: number;
        favorites?: number;
        lastViewedAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
};

export const PUBLIC_LISTING_PROJECTION = {
    _id: 1, id: 1, title: 1, price: 1, description: 1, images: 1, listingType: 1,
    attributes: 1, category: 1, seoSlug: 1, categoryId: 1, categoryName: 1,
    brandId: 1, brandName: 1, modelId: 1, modelName: 1, screenSize: 1,
    location: 1, sellerId: 1, status: 1, sellerType: 1, createdAt: 1,
    updatedAt: 1, views: 1, isFeatured: 1, isSpotlight: 1, isBoosted: 1,
    isBusiness: 1, verified: 1, businessName: 1, businessId: 1, sellerName: 1, expiresAt: 1,
    sparePartIds: 1, spareParts: 1, sparePartsSnapshot: 1, serviceTypeIds: 1,
    sparePartId: 1, priceMin: 1, priceMax: 1, diagnosticFee: 1, onsiteService: 1
};

export function toDomain(doc: DbListing): Listing {
    return {
        id: String(doc._id),
        title: doc.title,
        description: doc.description,
        price: doc.price,
        listingType: doc.listingType as Listing['listingType'],
        sellerId: String(doc.sellerId),
        status: doc.status as Listing['status'],
        categoryId: String(doc.categoryId),
        brandId: doc.brandId ? String(doc.brandId) : undefined,
        modelId: doc.modelId ? String(doc.modelId) : undefined,
        locationPath: Array.isArray(doc.locationPath) ? doc.locationPath.map((id) => String(id)) : undefined,
        images: doc.images ?? [],
        seoSlug: doc.seoSlug,
        location: {
            coordinates: doc.location?.coordinates?.coordinates ?? [0, 0],
            city: doc.location?.city,
            state: doc.location?.state,
            country: doc.location?.country,
            display: doc.location?.display,
            locationId: doc.location?.locationId ? String(doc.location.locationId) : undefined,
        },
        isDeleted: doc.isDeleted ?? false,
        isSold: doc.isSold ?? false,
        moderationStatus: doc.moderationStatus,
        fraudScore: doc.fraudScore,
        sellerTrustSnapshot: doc.sellerTrustSnapshot,
        sellerPriorityScore: doc.sellerPriorityScore,

        isSpotlight: doc.isSpotlight,
        spotlightExpiresAt: doc.spotlightExpiresAt,
        expiresAt: doc.expiresAt,
        views: doc.views ? {
            total: doc.views.total,
            unique: doc.views.unique,
            favorites: doc.views.favorites,
            lastViewedAt: doc.views.lastViewedAt,
        } : undefined,
        // DTO parity: map IAd fields present in Mongoose schema but previously
        // omitted here. Enables normalizeListing() to derive isBusiness correctly
        // and surfaces deviceCondition for the condition badge on all repository paths.
        sellerType: doc.sellerType,
        businessId: doc.businessId ? String(doc.businessId) : undefined,
        deviceCondition: doc.deviceCondition,
        sparePartIds: Array.isArray(doc.sparePartIds) ? doc.sparePartIds.map(id => String(id)) : (Array.isArray(doc.spareParts) ? doc.spareParts.map(id => String(id)) : undefined),
        sparePartsSnapshot: Array.isArray(doc.sparePartsSnapshot) ? doc.sparePartsSnapshot.map(p => ({
            _id: String(p._id),
            name: String(p.name),
            brand: p.brand ? String(p.brand) : undefined,
        })) : undefined,
        serviceTypeIds: Array.isArray(doc.serviceTypeIds) ? doc.serviceTypeIds.map(id => String(id)) : undefined,
        sparePartId: doc.sparePartId ? String(doc.sparePartId) : undefined,
        priceMin: typeof doc.priceMin === 'number' ? doc.priceMin : undefined,
        priceMax: typeof doc.priceMax === 'number' ? doc.priceMax : undefined,
        diagnosticFee: typeof doc.diagnosticFee === 'number' ? doc.diagnosticFee : undefined,
        onsiteService: typeof doc.onsiteService === 'boolean' ? doc.onsiteService : undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
