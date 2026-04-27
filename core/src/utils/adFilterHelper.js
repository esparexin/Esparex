"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdFilterFromCriteria = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoGeoUtils_1 = require("./mongoGeoUtils");
const adStatusService_1 = require("@core/services/adStatusService");
const CategoryQueryBuilder_1 = __importDefault(require("./CategoryQueryBuilder"));
/**
 * SSOT: Centralized Ad Filter Builder
 * Used by adQueryService (search/listing).
 */
const buildAdFilterFromCriteria = (criteria) => {
    const match = {};
    // Category
    Object.assign(match, CategoryQueryBuilder_1.default.forSingular().withFilters({ categoryId: criteria.categoryId }).build());
    // Brand
    if (criteria.brandId && mongoose_1.default.Types.ObjectId.isValid(criteria.brandId)) {
        match.brandId = new mongoose_1.default.Types.ObjectId(criteria.brandId);
    }
    // Model
    if (criteria.modelId && mongoose_1.default.Types.ObjectId.isValid(criteria.modelId)) {
        match.modelId = new mongoose_1.default.Types.ObjectId(criteria.modelId);
    }
    // Screen Size (Unified Filter)
    if (criteria.screenSize) {
        match.screenSize = criteria.screenSize;
    }
    const { hasGeo } = (0, mongoGeoUtils_1.normalizeGeoInput)(criteria.lat, criteria.lng);
    const normalizedLevel = typeof criteria.level === 'string'
        ? criteria.level.toLowerCase()
        : undefined;
    // Region-level selections (state/country) must not be overridden by
    // client-provided coordinates. Coordinates are still accepted for other levels.
    const shouldUseGeoOnly = hasGeo && normalizedLevel !== 'state' && normalizedLevel !== 'country';
    // Location Filtering Strategy
    // Priority 1: LAT/LNG present for non-region levels -> GEO SEARCH ONLY
    if (shouldUseGeoOnly) {
        // Skip all string/ID location logic, $geoNear bounds the search instead.
    }
    // Priority 2: Canonical locationId present -> STRUCTURED INDEXED SEARCH ONLY
    else if (criteria.locationId && mongoose_1.default.Types.ObjectId.isValid(criteria.locationId)) {
        const locationObjectId = new mongoose_1.default.Types.ObjectId(criteria.locationId);
        match.$or = [
            { locationPath: locationObjectId },
            { 'location.locationId': locationObjectId }
        ];
    }
    // Priority 3: Hierarchy fallback (strict equality only; no broad regex scans).
    const explicitState = typeof criteria.state === 'string' ? criteria.state.trim() : '';
    const explicitCountry = typeof criteria.country === 'string' ? criteria.country.trim() : '';
    const locationName = typeof criteria.location === 'string' ? criteria.location.trim() : '';
    if (explicitState || normalizedLevel === 'state') {
        const stateFilter = explicitState || locationName;
        if (stateFilter) {
            match['location.state'] = stateFilter;
        }
    }
    if (explicitCountry || normalizedLevel === 'country') {
        const countryFilter = explicitCountry || locationName;
        if (countryFilter) {
            match['location.country'] = countryFilter;
        }
    }
    // Seller
    if (criteria.sellerId && mongoose_1.default.Types.ObjectId.isValid(criteria.sellerId)) {
        match.sellerId = new mongoose_1.default.Types.ObjectId(criteria.sellerId);
    }
    // Price Range (Standard)
    if (typeof criteria.minPrice === 'number' || typeof criteria.maxPrice === 'number') {
        const priceMatch = {};
        if (typeof criteria.minPrice === 'number')
            priceMatch.$gte = criteria.minPrice;
        if (typeof criteria.maxPrice === 'number')
            priceMatch.$lte = criteria.maxPrice;
        match.price = priceMatch;
    }
    // Service Price Range (priceMin / priceMax)
    if (typeof criteria.priceMin === 'number') {
        match.priceMin = { $gte: criteria.priceMin };
    }
    if (typeof criteria.priceMax === 'number') {
        match.priceMax = { $lte: criteria.priceMax };
    }
    // On-site Service
    if (typeof criteria.onsiteService === 'boolean') {
        match.onsiteService = criteria.onsiteService;
    }
    // Keywords (Text Search)
    // Note: For aggregation pipelines ($geoNear), $text must be in the 'query' field.
    if (criteria.keywords?.trim()) {
        const query = criteria.keywords.trim();
        // Strategy: Use $text search as primary (fast, indexed)
        // If we want "fuzzy" support, we can also generate a regex fallback 
        // that handles common 1-character typos.
        match.$text = { $search: query };
        // 🧪 OPTIONAL: Fuzzy Regex Fallback
        // This is useful if $text search returns 0 results. 
        // For a single-stage buildFilter, we stick to $text but ensure it's normalized.
    }
    // Plan & Spotlight
    if (typeof criteria.isSpotlight === 'boolean') {
        match.isSpotlight = criteria.isSpotlight;
    }
    // Date Range
    if (criteria.createdAfter || criteria.createdBefore) {
        const dateMatch = {};
        if (criteria.createdAfter)
            dateMatch.$gte = new Date(criteria.createdAfter);
        if (criteria.createdBefore)
            dateMatch.$lte = new Date(criteria.createdBefore);
        match.createdAt = dateMatch;
    }
    // Status (if provided)
    if (criteria.status) {
        if (Array.isArray(criteria.status)) {
            const finalStatusList = criteria.status.map(s => (0, adStatusService_1.normalizeAdStatus)(s));
            match.status = { $in: Array.from(new Set(finalStatusList)) };
        }
        else if (typeof criteria.status === 'string') {
            match.status = (0, adStatusService_1.normalizeAdStatus)(criteria.status);
        }
        else {
            match.status = criteria.status;
        }
    }
    return match;
};
exports.buildAdFilterFromCriteria = buildAdFilterFromCriteria;
//# sourceMappingURL=adFilterHelper.js.map