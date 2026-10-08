import mongoose, { type ClientSession } from 'mongoose';
import AdModel from '../../../../models/Ad';
import { LISTING_STATUS, LISTING_TYPE, SERVICE_STATUS, INVENTORY_STATUS } from '@esparex/contracts';

import {
    type ActiveListingCountFilter,
    type Listing,
    type ListingFilter,
    type ListingUpdate,
    ListingRepositoryPort,
} from '../../../../domains/listings';
import {
    type DbListing,
    PUBLIC_LISTING_PROJECTION,
    toDomain,
} from '../../../../domains/listings/mappers/MongoListingMapper';

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
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
        const priceClause: Record<string, number> = {};
        if (filter.minPrice !== undefined) priceClause.$gte = filter.minPrice;
        if (filter.maxPrice !== undefined) priceClause.$lte = filter.maxPrice;
        mongoFilter.price = priceClause;
    } else if (filter.price !== undefined) {
        mongoFilter.price = filter.price;
    }
    if (filter.titleQuery) {
        mongoFilter.title = { $regex: new RegExp(filter.titleQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
    }
    if (filter.imageHashes !== undefined) {
        mongoFilter.imageHashes = filter.imageHashes;
    }
    if (filter.allowedStatuses && filter.allowedStatuses.length > 0) {
        mongoFilter.status = { $in: filter.allowedStatuses };
    } else if (filter.status) {
        mongoFilter.status = Array.isArray(filter.status) ? { $in: filter.status } : filter.status;
    }
    if (filter.listingType) mongoFilter.listingType = filter.listingType;
    if (filter.excludeSellerId) {
        mongoFilter.sellerId = { ...(mongoFilter.sellerId as Record<string, unknown> || {}), $ne: toMongoId(filter.excludeSellerId) };
    } else if (filter.sellerId) {
        mongoFilter.sellerId = typeof filter.sellerId === 'object' ? filter.sellerId : toMongoId(filter.sellerId);
    }
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
    if (filter.spotlightActiveOnly) {
        mongoFilter.isSpotlight = true;
        mongoFilter.spotlightExpiresAt = { $gt: new Date() };
    } else if (filter.isSpotlight !== undefined) {
        mongoFilter.isSpotlight = filter.isSpotlight;
    }
    if (filter.spotlightExpiredBefore) {
        mongoFilter.spotlightExpiresAt = { $lte: filter.spotlightExpiredBefore };
    } else if (filter.spotlightExpiresAt) {
        mongoFilter.spotlightExpiresAt = filter.spotlightExpiresAt;
    }
    if (filter.expiredBefore) {
        mongoFilter.expiresAt = { $lte: filter.expiredBefore };
    } else if (filter.expiresAt) {
        mongoFilter.expiresAt = filter.expiresAt;
    }
    if (filter.sparePartIds) {
        mongoFilter.sparePartIds = toMongoId(filter.sparePartIds);
    }
    if (filter.favoritesGreaterThan !== undefined) {
        mongoFilter['views.favorites'] = { $gt: filter.favoritesGreaterThan };
    }
    if (filter.allowedModerationStatuses && filter.allowedModerationStatuses.length > 0) {
        mongoFilter.moderationStatus = { ...(mongoFilter.moderationStatus as Record<string, unknown> || {}), $in: filter.allowedModerationStatuses };
    } else if (filter.excludeModerationStatuses && filter.excludeModerationStatuses.length > 0) {
        mongoFilter.moderationStatus = { ...(mongoFilter.moderationStatus as Record<string, unknown> || {}), $nin: filter.excludeModerationStatuses };
    } else if (filter.moderationStatus) {
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

interface ChainableQuery {
    select?: () => unknown;
    lean?: () => unknown;
    exec?: () => Promise<unknown>;
}

async function resolveMongoQuery<T>(q: unknown): Promise<T> {
    let curr: unknown = q;
    if (typeof curr === 'object' && curr !== null) {
        const query = curr as ChainableQuery;
        if (typeof query.select === 'function') curr = query.select();
        if (typeof (curr as ChainableQuery).lean === 'function') curr = (curr as ChainableQuery).lean!();
        if (typeof (curr as ChainableQuery).exec === 'function') curr = await (curr as ChainableQuery).exec!();
        else curr = await curr;
    } else {
        curr = await curr;
    }
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
        if (filter.session) q = q.session(filter.session as ClientSession);

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
        let q = AdModel.find(buildMongoFilter(filter)).select(PUBLIC_LISTING_PROJECTION);
        if (sort) q = q.sort(sort);
        if (skip !== undefined) q = q.skip(skip);
        if (limit !== undefined) q = q.limit(limit);
        const rawDocs = await resolveMongoQuery<DbListing[]>(q);
        const docs = Array.isArray(rawDocs) ? rawDocs : [];
        return docs.map(toDomain);
    }

    async findOne(filter: ListingFilter): Promise<Listing | null> {
        const doc = await resolveMongoQuery<DbListing | null>(AdModel.findOne(buildMongoFilter(filter)));
        return doc ? toDomain(doc) : null;
    }

    async insert(listing: ListingUpdate, session?: unknown): Promise<Listing> {
        const docs = await AdModel.create([listing as Record<string, unknown>], { session: session as ClientSession });
        const rawDoc: unknown = docs[0];
        return toDomain(rawDoc as DbListing);
    }

    async updateOne(id: string, update: ListingUpdate, session?: unknown): Promise<Listing | null> {
        const safeId = typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : String(id);
        const updateDoc = Object.keys(update).some(k => k.startsWith('$')) ? update : { $set: update };
        const query = AdModel.findByIdAndUpdate(safeId, updateDoc, { new: true, runValidators: true, session: session as ClientSession });
        const doc = await resolveMongoQuery<DbListing | null>(query);
        return doc ? toDomain(doc) : null;
    }

    async updateOneByFilter(filter: ListingFilter, update: ListingUpdate, session?: unknown): Promise<Listing | null> {
        const updateDoc = Object.keys(update).some(k => k.startsWith('$')) ? update : { $set: update };
        const filterDoc = buildMongoFilter(filter);
        const targetId = (filterDoc._id as { $in?: unknown[] } | undefined)?.$in?.[0] ?? filterDoc._id;
        const query = AdModel.findOneAndUpdate(
            filterDoc._id ? { ...filterDoc, _id: targetId } : filterDoc,
            updateDoc,
            { new: true, runValidators: true, session: session as ClientSession }
        );
        const doc = await resolveMongoQuery<DbListing | null>(query);
        return doc ? toDomain(doc) : null;
    }

    async updateMany(filter: ListingFilter, update: ListingUpdate, session?: unknown): Promise<number> {
        const updateDoc = Object.keys(update).some(k => k.startsWith('$')) ? update : { $set: update };
        const filterDoc = buildMongoFilter(filter);
        if (typeof AdModel.updateMany === 'function') {
            const result = await resolveMongoQuery<{ modifiedCount?: number } | null>(
                AdModel.updateMany(filterDoc, updateDoc).session(session as ClientSession)
            );
            return result?.modifiedCount ?? 0;
        }
        if (typeof AdModel.findOneAndUpdate === 'function') {
            const targetId = (filterDoc._id as { $in?: unknown[] } | undefined)?.$in?.[0] ?? filterDoc._id;
            await resolveMongoQuery(
                AdModel.findOneAndUpdate(
                    filterDoc._id ? { ...filterDoc, _id: targetId } : filterDoc,
                    updateDoc,
                    { runValidators: true, session: session as ClientSession }
                )
            );
            return 1;
        }
        return 0;
    }
}
