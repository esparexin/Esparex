import mongoose from 'mongoose';
import AdModel from '../../../../models/Ad';
import { LISTING_STATUS, LISTING_TYPE, SERVICE_STATUS, INVENTORY_STATUS } from '@esparex/contracts';

import {
    type ActiveListingCountFilter,
    type Listing,
    type ListingFilter,
    type ListingUpdate,
    ListingRepositoryPort,
} from '../../../../domains/listings';

// ─── Domain mapper ──────────────────────────────────────────────────────────

type DbListing = {
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
    isSpotlight?: boolean;
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

const PUBLIC_LISTING_PROJECTION = {
    _id: 1, id: 1, title: 1, price: 1, description: 1, images: 1, listingType: 1,
    attributes: 1, category: 1, seoSlug: 1, categoryId: 1, categoryName: 1,
    brandId: 1, brandName: 1, modelId: 1, modelName: 1, screenSize: 1,
    location: 1, sellerId: 1, status: 1, sellerType: 1, createdAt: 1,
    updatedAt: 1, views: 1, isFeatured: 1, isSpotlight: 1, isBoosted: 1,
    isBusiness: 1, verified: 1, businessName: 1, businessId: 1, sellerName: 1, expiresAt: 1
};

function toDomain(doc: DbListing): Listing {
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
        isSpotlight: doc.isSpotlight,
        spotlightExpiresAt: doc.spotlightExpiresAt,
        expiresAt: doc.expiresAt,
        views: doc.views ? {
            total: doc.views.total,
            unique: doc.views.unique,
            favorites: doc.views.favorites,
            lastViewedAt: doc.views.lastViewedAt,
        } : undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

// ─── Filter builder ─────────────────────────────────────────────────────────

function toMongoId(id: unknown): unknown {
    if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
    }
    if (typeof id === 'string' || typeof id === 'number') {
        return id;
    }
    return String(id ?? '');
}

function buildMongoFilter(filter: ListingFilter): Record<string, unknown> {
    const mongoFilter: Record<string, unknown> = {};

    if (filter._id !== undefined) {
        mongoFilter._id = typeof filter._id === 'object' && filter._id !== null ? filter._id : toMongoId(filter._id);
    }
    if (filter.price !== undefined) {
        mongoFilter.price = filter.price;
    }
    if (filter.imageHashes !== undefined) {
        mongoFilter.imageHashes = filter.imageHashes;
    }
    if (filter.status) {
        mongoFilter.status = Array.isArray(filter.status) ? { $in: filter.status } : filter.status;
    }
    if (filter.listingType) mongoFilter.listingType = filter.listingType;
    if (filter.sellerId) mongoFilter.sellerId = typeof filter.sellerId === 'object' ? filter.sellerId : toMongoId(filter.sellerId);
    if (filter.categoryId) mongoFilter.categoryId = typeof filter.categoryId === 'object' ? filter.categoryId : toMongoId(filter.categoryId);
    if (filter.brandId) mongoFilter.brandId = typeof filter.brandId === 'object' ? filter.brandId : toMongoId(filter.brandId);
    if (filter.modelId) mongoFilter.modelId = typeof filter.modelId === 'object' ? filter.modelId : toMongoId(filter.modelId);
    if (filter.duplicateFingerprint) {
        mongoFilter.duplicateFingerprint = filter.duplicateFingerprint;
    }
    if (filter.isDeleted !== undefined) {
        if (typeof filter.isDeleted === 'object' && filter.isDeleted !== null) {
            mongoFilter.isDeleted = filter.isDeleted;
        } else {
            mongoFilter.isDeleted = filter.isDeleted;
        }
    }
    if (filter.isSold !== undefined) mongoFilter.isSold = filter.isSold;
    if (filter.ids && filter.ids.length > 0) {
        mongoFilter._id = { $in: filter.ids.map(id => toMongoId(id)) };
    }
    if (filter.idsNotIn && filter.idsNotIn.length > 0) {
        mongoFilter._id = { ...(mongoFilter._id as Record<string, unknown> || {}), $nin: filter.idsNotIn.map(id => toMongoId(id)) };
    }
    if (filter.excludeStatus && filter.excludeStatus.length > 0) {
        mongoFilter.status = { ...(mongoFilter.status as Record<string, unknown> || {}), $nin: filter.excludeStatus };
    }
    const locationIdValue = filter.locationId || (filter['location.locationId'] as string);
    if (locationIdValue) {
        mongoFilter['location.locationId'] = toMongoId(locationIdValue);
    }
    if (filter.locationCity) {
        mongoFilter['location.city'] = filter.locationCity;
    }
    if (filter.locationState) {
        mongoFilter['location.state'] = filter.locationState;
    }
    if (filter.locationPath) {
        mongoFilter.locationPath = toMongoId(filter.locationPath);
    }
    if (filter.isSpotlight !== undefined) mongoFilter.isSpotlight = filter.isSpotlight;
    if (filter.spotlightExpiresAt) {
        mongoFilter.spotlightExpiresAt = filter.spotlightExpiresAt;
    }
    if (filter.expiresAt) mongoFilter.expiresAt = filter.expiresAt;
    if (filter.sparePartIds) {
        mongoFilter.sparePartIds = toMongoId(filter.sparePartIds);
    }
    if (filter.favoritesGreaterThan !== undefined) {
        mongoFilter['views.favorites'] = { $gt: filter.favoritesGreaterThan };
    }
    if (filter.moderationStatus) {
        mongoFilter.moderationStatus = filter.moderationStatus;
    }
    
    // Cursor pagination mapping
    if (filter.cursorCreatedAt) {
        if (filter.cursorId) {
            mongoFilter.$or = [
                ...(mongoFilter.$or as Record<string, unknown>[] || []),
                { createdAt: { $lt: filter.cursorCreatedAt } },
                {
                    createdAt: filter.cursorCreatedAt,
                    _id: { $lt: toMongoId(filter.cursorId) }
                }
            ];
        } else {
            mongoFilter.createdAt = { $lt: filter.cursorCreatedAt };
        }
    }

    if (filter.$or && !filter.cursorCreatedAt) {
        mongoFilter.$or = filter.$or;
    } else if (filter.$or && filter.cursorCreatedAt) {
        // If we already set $or from cursor, merge any existing $or using $and
        const existingOr = mongoFilter.$or as Record<string, unknown>[];
        delete mongoFilter.$or;
        mongoFilter.$and = [
            { $or: filter.$or },
            { $or: existingOr }
        ];
    }

    return mongoFilter;
}

async function resolveMongoQuery<T>(q: unknown): Promise<T> {
    let curr = q as any;
    if (curr && typeof curr.select === 'function') curr = curr.select();
    if (curr && typeof curr.lean === 'function') curr = curr.lean();
    if (curr && typeof curr.exec === 'function') curr = await curr.exec();
    else curr = await curr;
    return curr as T;
}

// ─── Adapter implementation ─────────────────────────────────────────────────

export class MongoListingRepositoryAdapter implements ListingRepositoryPort {
    async countActiveBySeller(filter: ActiveListingCountFilter): Promise<number> {
        const { sellerId, listingType, session } = filter;

        if (listingType === LISTING_TYPE.SERVICE) {
            let query = AdModel.countDocuments({
                sellerId,
                listingType: LISTING_TYPE.SERVICE,
                status: { $in: [SERVICE_STATUS.LIVE, SERVICE_STATUS.PENDING] },
                isDeleted: { $ne: true },
            });
            if (session) query = query.session(session as Parameters<typeof query.session>[0]);
            return query;
        }

        if (listingType === LISTING_TYPE.SPARE_PART) {
            let query = AdModel.countDocuments({
                sellerId,
                listingType: LISTING_TYPE.SPARE_PART,
                status: { $in: [INVENTORY_STATUS.LIVE, INVENTORY_STATUS.PENDING] },
                isDeleted: { $ne: true },
            });
            if (session) query = query.session(session as Parameters<typeof query.session>[0]);
            return query;
        }

        let query = AdModel.countDocuments({
            sellerId,
            listingType: LISTING_TYPE.AD,
            status: { $in: [LISTING_STATUS.LIVE, LISTING_STATUS.PENDING] },
            isDeleted: { $ne: true },
        });
        if (session) query = query.session(session as Parameters<typeof query.session>[0]);
        return query;
    }

    async count(filter: ListingFilter): Promise<number> {
        return AdModel.countDocuments(buildMongoFilter(filter));
    }

    async findWithinRadius(
        lng: number,
        lat: number,
        radiusKm: number,
        filter: ListingFilter,
        sort?: Record<string, 1 | -1>,
        limit?: number,
        skip?: number
    ): Promise<Listing[]> {
        const mongoFilter = buildMongoFilter(filter);
        
        mongoFilter['location.coordinates'] = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                $maxDistance: radiusKm * 1000
            }
        };

        let q = AdModel.find(mongoFilter).select(PUBLIC_LISTING_PROJECTION);
        if (sort) {
            q = q.sort(sort);
        }
        if (skip !== undefined) q = q.skip(skip);
        if (limit !== undefined) q = q.limit(limit);
        if (filter.session) q = q.session(filter.session as any);

        const docs = await q.lean<DbListing[]>();
        return (docs || []).map(toDomain);
    }

    async findById(id: string): Promise<Listing | null> {
        const safeId = typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : String(id);
        const doc = await resolveMongoQuery<DbListing | null>(AdModel.findById(safeId));
        return doc ? toDomain(doc) : null;
    }

    async find(filter: ListingFilter): Promise<readonly Listing[]> {
        const rawDocs = await resolveMongoQuery<DbListing[]>(AdModel.find(buildMongoFilter(filter)).select(PUBLIC_LISTING_PROJECTION));
        const docs = Array.isArray(rawDocs) ? rawDocs : [];
        return docs.map(toDomain);
    }

    async findWithLimit(filter: ListingFilter, sort?: Record<string, 1 | -1>, limit?: number, skip?: number): Promise<readonly Listing[]> {
        const q = AdModel.find(buildMongoFilter(filter)).select(PUBLIC_LISTING_PROJECTION);
        if (sort && typeof (q as any)?.sort === 'function') (q as any).sort(sort);
        if (skip !== undefined && typeof (q as any)?.skip === 'function') (q as any).skip(skip);
        if (limit !== undefined && typeof (q as any)?.limit === 'function') (q as any).limit(limit);
        const rawDocs = await resolveMongoQuery<DbListing[]>(q);
        const docs = Array.isArray(rawDocs) ? rawDocs : [];
        return docs.map(toDomain);
    }

    async findOne(filter: ListingFilter): Promise<Listing | null> {
        const doc = await resolveMongoQuery<DbListing | null>(AdModel.findOne(buildMongoFilter(filter)));
        return doc ? toDomain(doc) : null;
    }

    async insert(listing: ListingUpdate, session?: unknown): Promise<Listing> {
        const docs = await AdModel.create([listing as Record<string, unknown>], { session: session as any });
        return toDomain(docs[0] as unknown as DbListing);
    }

    async updateOne(id: string, update: ListingUpdate, session?: unknown): Promise<Listing | null> {
        const safeId = typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : String(id);
        const updateDoc = Object.keys(update).some(k => k.startsWith('$')) ? update : { $set: update };
        const query = AdModel.findByIdAndUpdate(safeId, updateDoc, { new: true, runValidators: true, session: session as any });
        const doc = await resolveMongoQuery<DbListing | null>(query);
        return doc ? toDomain(doc) : null;
    }

    async updateOneByFilter(filter: ListingFilter, update: ListingUpdate, session?: unknown): Promise<Listing | null> {
        const updateDoc = Object.keys(update).some(k => k.startsWith('$')) ? update : { $set: update };
        const filterDoc = buildMongoFilter(filter);
        const query = AdModel.findOneAndUpdate(
            filterDoc._id ? { ...filterDoc, _id: (filterDoc._id as any).$in?.[0] ?? filterDoc._id } : filterDoc,
            updateDoc,
            { new: true, runValidators: true, session: session as any }
        );
        const doc = await resolveMongoQuery<DbListing | null>(query);
        return doc ? toDomain(doc) : null;
    }

    async updateMany(filter: ListingFilter, update: ListingUpdate, session?: unknown): Promise<number> {
        const updateDoc = Object.keys(update).some(k => k.startsWith('$')) ? update : { $set: update };
        const filterDoc = buildMongoFilter(filter);
        if (typeof AdModel.updateMany === 'function') {
            const result = await resolveMongoQuery<{ modifiedCount?: number } | null>(
                AdModel.updateMany(filterDoc, updateDoc).session(session as any)
            );
            return result?.modifiedCount ?? 0;
        }
        if (typeof AdModel.findOneAndUpdate === 'function') {
            await resolveMongoQuery(
                AdModel.findOneAndUpdate(
                    filterDoc._id ? { ...filterDoc, _id: (filterDoc._id as any).$in?.[0] ?? filterDoc._id } : filterDoc,
                    updateDoc,
                    { runValidators: true, session: session as any }
                )
            );
            return 1;
        }
        return 0;
    }
}
