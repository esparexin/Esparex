"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
const shared_1 = require("@esparex/shared");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const moderationStatus_1 = require("@core/constants/enums/moderationStatus");
const db_1 = require("@core/config/db");
const Location_1 = __importDefault(require("./Location"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const ChatAvailabilityService_1 = require("@core/services/ChatAvailabilityService");
const slugGenerator_1 = require("@core/utils/slugGenerator");
const AdSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
    currency: { type: String, default: 'INR' },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true }, // Now Required
    brandId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Brand' },
    modelId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Model' },
    screenSize: { type: String },
    sparePartIds: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'SparePart' }],
        validate: [
            (val) => val.length <= 100,
            '{PATH} exceeds the limit of 100 items'
        ]
    },
    sparePartsSnapshot: [{
            _id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
            brand: { type: String, required: true }
        }],
    images: [{ type: String }],
    thumbnails: [{ type: String }],
    listingType: { type: String, enum: listingType_1.LISTING_TYPE_VALUES, default: listingType_1.LISTING_TYPE.AD },
    attributes: { type: mongoose_1.Schema.Types.Mixed },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    sellerType: { type: String, enum: ['user', 'business'], default: 'user' },
    status: {
        type: String,
        enum: listingStatus_1.LISTING_STATUS_VALUES,
        default: listingStatus_1.LISTING_STATUS.PENDING
    },
    rejectionReason: { type: String },
    duplicateFingerprint: { type: String },
    duplicateScore: { type: Number, default: 0 },
    duplicateOf: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad' },
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
        enum: moderationStatus_1.MODERATION_STATUS_VALUES,
        default: moderationStatus_1.MODERATION_STATUS.HELD_FOR_REVIEW
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
                    validator: (coords) => (0, shared_1.hasValidCoordinateArray)(coords),
                    message: 'Valid [longitude, latitude] coordinates are required.'
                }
            }
        },
        locationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Location' }, // Canonical Reference — SSOT
    },
    locationPath: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Location' }],
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
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    timeline: [{
            status: { type: String, enum: [...listingStatus_1.LISTING_STATUS_VALUES, 'deleted', 'restored', 'spotlight_expired'], required: true },
            timestamp: { type: Date, required: true },
            reason: { type: String }
        }],
    reviewVersion: { type: Number, default: 0 },
    freshnessScore: { type: Number, default: 0 },
    // --- Unified Listing Engine: Service & Spare Part Extensions ---
    businessId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business' },
    priceMin: { type: Number },
    priceMax: { type: Number },
    diagnosticFee: { type: Number },
    onsiteService: { type: Boolean, default: false },
    turnaroundTime: { type: String },
    warranty: { type: String },
    included: { type: String },
    excluded: { type: String },
    serviceTypeIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'ServiceType' }],
    sparePartId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SparePart' },
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
            const json = ret;
            json.id = json._id?.toString();
            delete json._id;
            return json;
        }
    }
});
// toJSON Helper is defined within AdSchema options
AdSchema.index({ seoSlug: 1 }, { name: 'ad_seoSlug_unique_idx', unique: true, sparse: true });
// 🚀 CORE PERFORMANCE INDEXES (Explicitly Named)
AdSchema.index({ 'location.coordinates': '2dsphere' }, { name: 'ad_geo_coordinates_2dsphere' });
AdSchema.index({ createdAt: -1 }, {
    name: 'ad_status_live_createdAt_partial_idx',
    partialFilterExpression: { status: listingStatus_1.LISTING_STATUS.LIVE, isDeleted: false }
});
AdSchema.index({ sellerId: 1, status: 1 }, { name: 'ad_sellerId_status_idx' });
AdSchema.index({ duplicateScore: 1 }, { name: 'ad_duplicateScore_idx' });
AdSchema.index({ isDuplicateFlag: 1 }, { name: 'ad_isDuplicateFlag_idx' });
AdSchema.index({ fraudScore: 1 }, { name: 'ad_fraudScore_idx' });
AdSchema.index({ isSpotlight: 1 }, { name: 'ad_isSpotlight_idx' });
AdSchema.index({ sellerTrustSnapshot: 1 }, { name: 'ad_sellerTrustSnapshot_idx' });
AdSchema.index({ expiresAt: 1 }, { name: 'ad_expiresAt_ttl_idx', expireAfterSeconds: 0 });
AdSchema.index({ duplicateOf: 1 }, { name: 'ad_duplicateOf_idx' });
AdSchema.index({ modelId: 1 }, { name: 'ad_modelId_idx' });
AdSchema.index({ title: 'text', description: 'text' }, { weights: { title: 10, description: 5 }, name: 'ad_text_search_idx' });
AdSchema.index({ isDeleted: 1 }, { name: 'idx_ad_isDeleted' });
AdSchema.index({ sparePartId: 1, status: 1, createdAt: -1 }, { name: 'ad_sparePartId_status_idx', sparse: true });
AdSchema.index({ businessId: 1, status: 1, createdAt: -1 }, { name: 'ad_businessId_status_idx', sparse: true });
// ─── Phase 1: Unified Listing Engine indexes ──────────────────────────────────
// Covers: per-listingType feed tabs, admin moderation queue, type-aware cron expiry
AdSchema.index({ listingType: 1, status: 1, createdAt: -1 }, { name: 'idx_ad_listingType_status_createdAt' });
// Covers: brand+category search filter used by BrowseAds and related listing discovery
AdSchema.index({ brandId: 1, categoryId: 1, status: 1 }, { name: 'idx_ad_brand_category_status' });
// 🚀 ADVANCED INDEX HARDENING 🚀
// 1. Public visibility listing index — covers status/isDeleted/expiresAt with freshness sort
// (former narrower ad_status_live_createdAt_minus1_partial index removed — redundant left-prefix of this one)
AdSchema.index({ status: 1, isDeleted: 1, expiresAt: 1, createdAt: -1 }, {
    name: 'ad_public_visibility_createdAt_idx',
    partialFilterExpression: { status: listingStatus_1.LISTING_STATUS.LIVE, isDeleted: false }
});
// 2. Spotlight Partial Index
AdSchema.index({ status: 1, isSpotlight: 1, createdAt: -1 }, {
    name: 'ad_spotlight_live_createdAt_minus1_partial',
    partialFilterExpression: { status: listingStatus_1.LISTING_STATUS.LIVE }
});
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
AdSchema.index({ moderationStatus: 1, status: 1, createdAt: -1 }, { name: 'ad_moderationStatus_status_freshness_idx' });
// L3 hierarchy support: state-level range scan used by the PR-3 fallback chain
AdSchema.index({ 'location.state': 1, status: 1, createdAt: -1 }, {
    name: 'ad_state_status_freshness_idx',
    partialFilterExpression: { status: listingStatus_1.LISTING_STATUS.LIVE, isDeleted: false }
});
// L2 city fallback: used by FeedDecisionEngine city-scope stage
AdSchema.index({ 'location.city': 1, status: 1, createdAt: -1 }, {
    name: 'ad_city_status_freshness_idx',
    partialFilterExpression: { status: listingStatus_1.LISTING_STATUS.LIVE, isDeleted: false }
});
// 🚀 SHARDING & CLUSTERING STRATEGY
AdSchema.index({ sellerId: 1, createdAt: 1 }, { name: 'ad_seller_clustering_idx' });
// 🚀 OPTIMIZED LISTING SEARCH
AdSchema.index({ categoryId: 1, status: 1, createdAt: -1 }, {
    name: 'ad_category_listing_search_idx',
    partialFilterExpression: { status: listingStatus_1.LISTING_STATUS.LIVE, isDeleted: false }
});
AdSchema.index({
    sellerId: 1,
    status: 1,
    categoryId: 1,
    brandId: 1,
    modelId: 1,
    'location.locationId': 1,
    createdAt: -1
}, { name: 'ad_seller_complex_listing_idx' });
AdSchema.index({ duplicateFingerprint: 1 }, {
    name: 'ad_duplicateFingerprint_unique_partial',
    unique: true,
    partialFilterExpression: {
        status: { $in: [listingStatus_1.LISTING_STATUS.LIVE, listingStatus_1.LISTING_STATUS.PENDING] },
        duplicateFingerprint: { $exists: true },
        isDeleted: false
    }
});
AdSchema.plugin(softDeletePlugin_1.default);
const sanitizeAdLocation = (value) => {
    if (!value || typeof value !== 'object')
        return value;
    const location = value;
    if ('coordinates' in location) {
        const nextGeo = (0, shared_1.sanitizeGeoPoint)(location.coordinates);
        if (!nextGeo) {
            delete location.coordinates;
        }
        else {
            location.coordinates = nextGeo;
        }
    }
    return location;
};
const touchesChatAvailability = (update) => {
    if (!update)
        return false;
    const watchedKeys = ['status', 'isDeleted', 'isChatLocked'];
    if (watchedKeys.some((key) => Object.prototype.hasOwnProperty.call(update, key))) {
        return true;
    }
    const nestedUpdateKeys = ['$set', '$unset'];
    return nestedUpdateKeys.some((operator) => {
        const operatorValue = update[operator];
        if (!operatorValue || typeof operatorValue !== 'object') {
            return false;
        }
        return watchedKeys.some((key) => Object.prototype.hasOwnProperty.call(operatorValue, key));
    });
};
AdSchema.pre('save', async function () {
    (this.$locals).syncChatAvailability =
        !this.isNew && (this.isModified('status') ||
            this.isModified('isDeleted') ||
            this.isModified('isChatLocked'));
    this.location = sanitizeAdLocation(this.location);
    // ── Location consistency guard (PR 4 — dual-write contract) ──────────────
    // If a canonical locationId is set but the denormalised city/state fields
    // are empty, auto-populate them from the Location document so that L2/L3
    // fallback matching works correctly. Logs a warning if the Location doc
    // cannot be found so the issue surfaces without blocking the write.
    if (this.location?.locationId && (!this.location.city || !this.location.state)) {
        try {
            const loc = await Location_1.default.findById(this.location.locationId)
                .select('+city +state +country')
                .lean();
            if (loc) {
                if (!this.location.city && loc.city)
                    this.location.city = loc.city;
                if (!this.location.state && loc.state)
                    this.location.state = loc.state;
                if (!this.location.country && loc.country)
                    this.location.country = loc.country;
            }
            else {
                logger_1.default.warn('Ad.pre(save): locationId present but Location doc not found — dual-write cannot be repaired', {
                    adId: this._id?.toString(),
                    locationId: this.location.locationId?.toString(),
                });
            }
        }
        catch (err) {
            logger_1.default.warn('Ad.pre(save): failed to auto-populate city/state from locationId', {
                adId: this._id?.toString(),
                locationId: this.location.locationId?.toString(),
                err: String(err),
            });
        }
    }
    if (!this.seoSlug) {
        this.seoSlug = await (0, slugGenerator_1.generateUniqueSlug)(Ad, this.title, undefined);
    }
});
AdSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    this._syncChatAvailability = touchesChatAvailability(update);
    if (!update)
        return;
    if ('location' in update) {
        update.location = sanitizeAdLocation(update.location);
    }
    if (update.$set && typeof update.$set === 'object') {
        const setObj = update.$set;
        if ('location' in setObj) {
            setObj.location = sanitizeAdLocation(setObj.location);
        }
        if ('location.coordinates' in setObj) {
            const nextGeo = (0, shared_1.sanitizeGeoPoint)(setObj['location.coordinates']);
            if (!nextGeo) {
                delete setObj['location.coordinates'];
            }
            else {
                setObj['location.coordinates'] = nextGeo;
            }
        }
    }
});
AdSchema.post('save', async function (doc) {
    const shouldSync = Boolean((doc.$locals).syncChatAvailability);
    if (!shouldSync)
        return;
    const session = typeof doc.$session === 'function' ? doc.$session() : undefined;
    await (0, ChatAvailabilityService_1.syncConversationAvailabilityForListing)({
        _id: doc._id,
        status: doc.status,
        isDeleted: doc.isDeleted,
        isChatLocked: doc.isChatLocked,
    }, session);
});
AdSchema.post('findOneAndUpdate', async function (doc) {
    if (!this._syncChatAvailability || !doc) {
        return;
    }
    const options = this.getOptions();
    await (0, ChatAvailabilityService_1.syncConversationAvailabilityForListing)({
        _id: doc._id,
        status: doc.status,
        isDeleted: doc.isDeleted,
        isChatLocked: doc.isChatLocked,
    }, options.session || undefined);
});
// POST-SAVE ERROR HOOK implementation removed (duplicate mutation of seoSlug)
const Ad = (0, db_1.getUserConnection)().models.Ad || (0, db_1.getUserConnection)().model('Ad', AdSchema);
exports.default = Ad;
//# sourceMappingURL=Ad.js.map