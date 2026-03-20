import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { Ad as SharedAd } from '@shared/schemas/ad.schema';
import { ISoftDeleteDocument } from '../utils/softDeletePlugin';
import { hasValidCoordinateArray } from '@shared/utils/geoUtils';
import { AD_STATUS, AD_STATUS_VALUES, AdStatusValue } from '@shared/enums/adStatus';

export interface IAd extends Document, ISoftDeleteDocument {
    title: string;
    description: string;
    price: number;
    isFree: boolean;
    currency: string;
    categoryId: Types.ObjectId;
    brandId?: Types.ObjectId;
    modelId?: Types.ObjectId;
    screenSize?: string;
    sparePartIds?: Types.ObjectId[];
    sparePartsSnapshot?: Array<{
        _id: Types.ObjectId;
        name: string;
        brand: string;
    }>;
    images: string[];
    listingType?: 'ad' | 'service' | 'spare_part';
    attributes?: Record<string, unknown>;
    sellerId: Types.ObjectId;
    sellerType: 'user' | 'business';
    status: AdStatusValue;
    rejectionReason?: string;
    duplicateFingerprint?: string;
    duplicateScore: number;
    duplicateOf?: Types.ObjectId;
    isDuplicateFlag: boolean;
    imageHashes: string[];
    soldAt?: Date;
    soldReason?: 'sold_on_platform' | 'sold_outside' | 'no_longer_available';
    fraudScore: number;
    fraudFlags: string[];
    moderationStatus: 'auto_approved' | 'held_for_review' | 'manual_approved' | 'rejected' | 'community_hidden';
    moderationReason?: string;
    seoSlug: string;
    location: {
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        display?: string;
        coordinates: {
            type: 'Point';
            coordinates: [number, number];
        };
        locationId?: Types.ObjectId;
    };
    locationPath: Types.ObjectId[];
    views: {
        total: number;
        unique: number;
        favorites: number;
        chats: number;
        lastViewedAt?: Date;
    };
    deviceCondition?: 'power_on' | 'power_off';
    isSpotlight: boolean;
    isChatLocked: boolean;
    spotlightExpiresAt?: Date;
    sellerTrustSnapshot: number;
    listingQualityScore: number;
    expiresAt?: Date;
    publishedAt?: Date;
    approvedAt?: Date;
    approvedBy?: Types.ObjectId;
    timeline: Array<{
        status: string;
        timestamp: Date;
        reason?: string;
    }>;
    userId?: Types.ObjectId;
    reviewVersion: number;
    freshnessScore: number;

    // --- Unified Listing Engine: Service & Spare Part Extensions ---
    businessId?: Types.ObjectId;
    priceMin?: number;
    priceMax?: number;
    diagnosticFee?: number;
    onsiteService?: boolean;
    turnaroundTime?: string;
    warranty?: string;
    included?: string;
    excluded?: string;
    serviceTypeIds?: Types.ObjectId[];
    sparePartId?: Types.ObjectId;
    compatibleModels?: Types.ObjectId[];
    condition?: 'new' | 'used' | 'refurbished';
    stock?: number;
    deviceType?: string;
}


const AdSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
    currency: { type: String, default: 'INR' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true }, // Now Required
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
    modelId: { type: Schema.Types.ObjectId, ref: 'Model' },
    screenSize: { type: String },
    sparePartIds: {
        type: [{ type: Schema.Types.ObjectId, ref: 'SparePart' }],
        validate: [
            (val: any[]) => val.length <= 100,
            '{PATH} exceeds the limit of 100 items'
        ]
    },
    sparePartsSnapshot: [{
        _id: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        brand: { type: String, required: true }
    }],

    images: [{ type: String }],
    listingType: { type: String, enum: ['ad', 'service', 'spare_part'], default: 'ad' },
    attributes: { type: Schema.Types.Mixed },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    sellerType: { type: String, enum: ['user', 'business'], default: 'user' },
    status: {
        type: String,
        enum: AD_STATUS_VALUES,
        default: AD_STATUS.PENDING
    },
    rejectionReason: { type: String },
    duplicateFingerprint: { type: String },
    duplicateScore: { type: Number, default: 0 },
    duplicateOf: { type: Schema.Types.ObjectId, ref: 'Ad' },
    isDuplicateFlag: { type: Boolean, default: false },
    imageHashes: [{ type: String }],
    soldAt: { type: Date },
    soldReason: {
        type: String,
        enum: ['sold_on_platform', 'sold_outside', 'no_longer_available']
    },
    fraudScore: { type: Number, default: 0 },
    fraudFlags: [{ type: String }],
    moderationStatus: {
        type: String,
        enum: ['auto_approved', 'held_for_review', 'manual_approved', 'rejected', 'community_hidden'],
        default: 'held_for_review'
    },
    moderationReason: { type: String },
    seoSlug: { type: String }, // AI Optimized
    location: {
        address: { type: String },
        // ─── DUAL-WRITE CONTRACT (PR 4 — Location SSOT) ───────────────────────
        // `locationId` is the SINGLE SOURCE OF TRUTH reference to the Location
        // collection document. The fields below (`city`, `state`, `country`,
        // `display`) are DERIVED / DENORMALISED copies kept for query performance
        // (text-index fallback for L3 state matching, display purposes).
        //
        // Rules:
        //   1. When `locationId` is set, `city` and `state` MUST be populated
        //      from the referenced Location document at write time.
        //   2. On update, if `locationId` changes, the denormalised fields MUST
        //      be updated atomically in the same operation.
        //   3. Do NOT filter ads by `location.city` or `location.state` alone —
        //      always prefer `location.locationId` where possible.
        // ─────────────────────────────────────────────────────────────────────
        city: { type: String },
        state: { type: String },
        country: { type: String },
        display: { type: String },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: (coords: number[]) => hasValidCoordinateArray(coords),
                    message: 'Valid [longitude, latitude] coordinates are required.'
                }
            }
        },
        locationId: { type: Schema.Types.ObjectId, ref: 'Location' }, // Canonical Reference — SSOT
    },
    locationPath: [{ type: Schema.Types.ObjectId, ref: 'Location' }],
    views: {
        total: { type: Number, default: 0 },
        unique: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        chats: { type: Number, default: 0 },
        lastViewedAt: { type: Date }
    },
    deviceCondition: { type: String, enum: ['power_on', 'power_off'] },
    isSpotlight: { type: Boolean, default: false },
    isChatLocked: { type: Boolean, default: false },
    spotlightExpiresAt: { type: Date },
    sellerTrustSnapshot: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    listingQualityScore: { type: Number, default: 0 },
    expiresAt: { type: Date },
    publishedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    timeline: [{
        status: { type: String, enum: [...AD_STATUS_VALUES, 'deleted', 'restored', 'spotlight_expired'], required: true },
        timestamp: { type: Date, required: true },
        reason: { type: String }
    }],
    reviewVersion: { type: Number, default: 0 },
    freshnessScore: { type: Number, default: 0 },

    // --- Unified Listing Engine: Service & Spare Part Extensions ---
    businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
    priceMin: { type: Number },
    priceMax: { type: Number },
    diagnosticFee: { type: Number },
    onsiteService: { type: Boolean, default: false },
    turnaroundTime: { type: String },
    warranty: { type: String },
    included: { type: String },
    excluded: { type: String },
    serviceTypeIds: [{ type: Schema.Types.ObjectId, ref: 'ServiceType' }],
    sparePartId: { type: Schema.Types.ObjectId, ref: 'SparePart' },
    compatibleModels: [{ type: Schema.Types.ObjectId, ref: 'Model' }],
    condition: { type: String, enum: ['new', 'used', 'refurbished'] },
    stock: { type: Number },
    deviceType: { type: String }
}, {
    timestamps: true,
    toObject: {
        virtuals: true,
        versionKey: false,
    },
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string; sellerId?: any };
            json.id = json._id?.toString();
            // Harmonization alias
            json.userId = json.sellerId;
            delete json._id;
            return json;
        }
    }
});

// toJSON Helper is defined within AdSchema options


AdSchema.index({ seoSlug: 1 }, { name: 'ad_seoSlug_unique_idx', unique: true, sparse: true });

// 🚀 CORE PERFORMANCE INDEXES (Explicitly Named)
AdSchema.index({ 'location.coordinates': '2dsphere' }, { name: 'ad_geo_coordinates_2dsphere' });
AdSchema.index({ status: 1, createdAt: -1 }, { name: 'ad_status_createdAt_idx' });
AdSchema.index({ status: 1 }, { name: 'ad_status_idx' });
AdSchema.index({ sellerId: 1, status: 1 }, { name: 'ad_sellerId_status_idx' });
AdSchema.index({ duplicateScore: 1 }, { name: 'ad_duplicateScore_idx' });
AdSchema.index({ isDuplicateFlag: 1 }, { name: 'ad_isDuplicateFlag_idx' });
AdSchema.index({ fraudScore: 1 }, { name: 'ad_fraudScore_idx' });
AdSchema.index({ isSpotlight: 1 }, { name: 'ad_isSpotlight_idx' });
AdSchema.index({ sellerTrustSnapshot: 1 }, { name: 'ad_sellerTrustSnapshot_idx' });
AdSchema.index({ categoryId: 1 }, { name: 'ad_categoryId_idx' });
AdSchema.index({ expiresAt: 1 }, { name: 'ad_expiresAt_idx' });
AdSchema.index({ duplicateOf: 1 }, { name: 'ad_duplicateOf_idx' });
AdSchema.index({ brandId: 1 }, { name: 'ad_brandId_idx' });
AdSchema.index({ modelId: 1 }, { name: 'ad_modelId_idx' });

AdSchema.index({ title: 'text', description: 'text' }, { weights: { title: 10, description: 5 }, name: 'ad_text_search_idx' });
AdSchema.index({ listingType: 1, status: 1 }, { name: 'idx_ad_listingType_status' });
AdSchema.index({ isDeleted: 1 }, { name: 'idx_ad_isDeleted' });
AdSchema.index({ sparePartId: 1, status: 1, createdAt: -1 }, { name: 'ad_sparePartId_status_idx', sparse: true });
AdSchema.index({ businessId: 1, status: 1, createdAt: -1 }, { name: 'ad_businessId_status_idx', sparse: true });

// ─── Phase 1: Unified Listing Engine indexes ──────────────────────────────────
// Covers: per-listingType feed tabs, admin moderation queue, type-aware cron expiry
AdSchema.index(
    { listingType: 1, status: 1, createdAt: -1 },
    { name: 'idx_ad_listingType_status_createdAt' }
);
// Covers: brand+category search filter used by BrowseAds + SimilarAdsService
AdSchema.index(
    { brandId: 1, categoryId: 1, status: 1 },
    { name: 'idx_ad_brand_category_status' }
);

// 🚀 ADVANCED INDEX HARDENING 🚀

// 1. Public visibility listing index — covers status/isDeleted/expiresAt with freshness sort
// (former narrower ad_status_live_createdAt_minus1_partial index removed — redundant left-prefix of this one)
AdSchema.index(
    { status: 1, isDeleted: 1, expiresAt: 1, createdAt: -1 },
    {
        name: 'ad_public_visibility_createdAt_idx',
        partialFilterExpression: { status: AD_STATUS.LIVE, isDeleted: false }
    }
);

// 2. Spotlight Partial Index
AdSchema.index(
    { status: 1, isSpotlight: 1, createdAt: -1 },
    { 
        name: 'ad_spotlight_live_createdAt_minus1_partial',
        partialFilterExpression: { status: AD_STATUS.LIVE } 
    }
);

AdSchema.index({
    'location.country': 1,
    'location.state': 1,
    'status': 1,
    'createdAt': -1
}, { name: 'ad_location_hierarchy_visibility_idx' });

AdSchema.index({ 
    status: 1, 
    categoryId: 1, 
    createdAt: -1 
}, { name: 'ad_status_category_freshness_idx' });

AdSchema.index({
    'location.locationId': 1,
    'categoryId': 1,
    'status': 1,
    'createdAt': -1
}, { name: 'ad_location_category_freshness_idx' });

AdSchema.index({ status: 1, locationPath: 1, createdAt: -1 }, { name: 'ad_status_locationPath_freshness_idx' });

AdSchema.index({ status: 1, expiresAt: 1, categoryId: 1, 'location.coordinates': '2dsphere', freshnessScore: -1 }, { name: 'ad_feed_ranking_freshness_idx' });

// 🔒 FEED SAFETY: moderationStatus compound index
// Covers: feed queries filtering by both status + moderationStatus to prevent
// community-hidden or admin-rejected ads from leaking into public results.
AdSchema.index(
    { moderationStatus: 1, status: 1, createdAt: -1 },
    { name: 'ad_moderationStatus_status_freshness_idx' }
);

// L3 hierarchy support: state-level range scan used by the PR-3 fallback chain
AdSchema.index(
    { 'location.state': 1, status: 1, createdAt: -1 },
    {
        name: 'ad_state_status_freshness_idx',
        partialFilterExpression: { status: 'live', isDeleted: false }
    }
);

// 🚀 SHARDING & CLUSTERING STRATEGY
AdSchema.index({ sellerId: 1, createdAt: 1 }, { name: 'ad_seller_clustering_idx' });

// 🚀 OPTIMIZED LISTING SEARCH
AdSchema.index(
    { categoryId: 1, status: 1, createdAt: -1 },
    { 
        name: 'ad_category_listing_search_idx',
        partialFilterExpression: { status: AD_STATUS.LIVE, isDeleted: false }
    }
);

AdSchema.index({
    sellerId: 1,
    status: 1,
    categoryId: 1,
    brandId: 1,
    modelId: 1,
    'location.locationId': 1,
    createdAt: -1
}, { name: 'ad_seller_complex_listing_idx' });
AdSchema.index(
    { duplicateFingerprint: 1 },
    {
        name: 'ad_duplicateFingerprint_unique_partial',
        unique: true,
        partialFilterExpression: {
            status: { $in: [AD_STATUS.LIVE, AD_STATUS.PENDING] },
            duplicateFingerprint: { $exists: true },
            isDeleted: false
        }
    }
);
// Performance indexes
import { getUserConnection } from '../config/db';
import softDeletePlugin from '../utils/softDeletePlugin';
import { generateUniqueSlug } from '../utils/slugGenerator';

AdSchema.plugin(softDeletePlugin);

const sanitizeGeoPoint = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return undefined;
    const node = value as Record<string, unknown>;
    const coords = Array.isArray(node.coordinates) ? node.coordinates as number[] : undefined;
    return coords && hasValidCoordinateArray(coords) ? node : undefined;
};

const sanitizeAdLocation = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return value;
    const location = value as Record<string, unknown>;
    if ('coordinates' in location) {
        const nextGeo = sanitizeGeoPoint(location.coordinates);
        if (!nextGeo) {
            delete location.coordinates;
        } else {
            location.coordinates = nextGeo;
        }
    }
    return location;
};

AdSchema.pre('save', async function (this: IAd) {
    this.location = sanitizeAdLocation(this.location) as IAd['location'];

    // ── Location consistency guard (PR 4 — dual-write contract) ──────────────
    // If a canonical locationId is set but the denormalised city/state fields
    // are empty, the hierarchy matching at L2/L3 will silently break.
    // This guard logs a warning so the issue surfaces without blocking writes.
    if (this.location?.locationId && (!this.location.city || !this.location.state)) {
        const logger = (await import('../utils/logger')).default;
        logger.warn('Ad.pre(save): locationId present but city/state is empty — dual-write contract violation', {
            adId: this._id?.toString(),
            locationId: this.location.locationId?.toString(),
            city: this.location.city,
            state: this.location.state,
        });
    }

    if (!this.seoSlug) {
        this.seoSlug = await generateUniqueSlug(Ad, this.title as string, undefined);
    }
});

AdSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() as Record<string, unknown> | undefined;
    if (!update) return;

    if ('location' in update) {
        update.location = sanitizeAdLocation(update.location);
    }

    if (update.$set && typeof update.$set === 'object') {
        const setObj = update.$set as Record<string, unknown>;
        if ('location' in setObj) {
            setObj.location = sanitizeAdLocation(setObj.location);
        }
        if ('location.coordinates' in setObj) {
            const nextGeo = sanitizeGeoPoint(setObj['location.coordinates']);
            if (!nextGeo) {
                delete setObj['location.coordinates'];
            } else {
                setObj['location.coordinates'] = nextGeo;
            }
        }
    }
});

// Harmonization Virtuals
AdSchema.virtual('userId').get(function() {
    return this.sellerId;
}).set(function(v) {
    this.sellerId = v;
});

// POST-SAVE ERROR HOOK implementation removed (duplicate mutation of seoSlug)

const Ad: Model<IAd> = getUserConnection().models.Ad || getUserConnection().model<IAd>('Ad', AdSchema);

export default Ad;
