import mongoose from 'mongoose';
import { AD_STATUS } from '@shared/enums/adStatus';
import { normalizeGeoInput } from './GeoUtils';
import { normalizeAdStatus } from '../services/adStatusService';
import CategoryQueryBuilder from './CategoryQueryBuilder';

type UnknownRecord = Record<string, unknown>;

export interface AdFilterCriteria {
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    minPrice?: number;
    maxPrice?: number;
    priceMin?: number;
    priceMax?: number;
    onsiteService?: boolean;
    screenSize?: string;

    keywords?: string;
    locationId?: string;
    location?: string;
    level?: 'country' | 'state' | 'district' | 'city' | 'area' | 'village';
    district?: string;
    state?: string;
    country?: string;
    lat?: number | string;
    lng?: number | string;
    sellerId?: string;
    isSpotlight?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    status?: string | string[];
}

/**
 * SSOT: Centralized Ad Filter Builder
 * Used by adQueryService (search/listing).
 */
export const buildAdFilterFromCriteria = (criteria: AdFilterCriteria): UnknownRecord => {
    const match: UnknownRecord = {};

    // Category
    Object.assign(match, CategoryQueryBuilder.forSingular().withFilters({ categoryId: criteria.categoryId }).build());

    // Brand
    if (criteria.brandId && mongoose.Types.ObjectId.isValid(criteria.brandId)) {
        match.brandId = new mongoose.Types.ObjectId(criteria.brandId);
    }

    // Model
    if (criteria.modelId && mongoose.Types.ObjectId.isValid(criteria.modelId)) {
        match.modelId = new mongoose.Types.ObjectId(criteria.modelId);
    }

    // Screen Size (Unified Filter)
    if (criteria.screenSize) {
        match.screenSize = criteria.screenSize;
    }

    const { hasGeo } = normalizeGeoInput(criteria.lat, criteria.lng);

    // Location Filtering Strategy
    // Priority 1: LAT/LNG present -> Use GEO SEARCH ONLY (regex skipped)
    if (hasGeo) {
        // Skip all string/ID location logic, $geoNear bounds the search instead.
    }
    // Priority 2: Canonical locationId present -> STRUCTURED INDEXED SEARCH ONLY
    else if (criteria.locationId && mongoose.Types.ObjectId.isValid(criteria.locationId)) {
        const locationObjectId = new mongoose.Types.ObjectId(criteria.locationId);
        match.$or = [
            { locationPath: locationObjectId },
            { 'location.locationId': locationObjectId }
        ];
    }
    // Priority 3: Fuzzy string-based search is removed to enforce strict geo-queries and prevent full collection scans.

    // Seller
    if (criteria.sellerId && mongoose.Types.ObjectId.isValid(criteria.sellerId)) {
        match.sellerId = new mongoose.Types.ObjectId(criteria.sellerId);
    }

    // Price Range (Standard)
    if (typeof criteria.minPrice === 'number' || typeof criteria.maxPrice === 'number') {
        const priceMatch: UnknownRecord = {};
        if (typeof criteria.minPrice === 'number') priceMatch.$gte = criteria.minPrice;
        if (typeof criteria.maxPrice === 'number') priceMatch.$lte = criteria.maxPrice;
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
        match.$text = { $search: criteria.keywords.trim() };
    }

    // Plan & Spotlight
    if (typeof criteria.isSpotlight === 'boolean') {
        match.isSpotlight = criteria.isSpotlight;
    }

    // Date Range
    if (criteria.createdAfter || criteria.createdBefore) {
        const dateMatch: UnknownRecord = {};
        if (criteria.createdAfter) dateMatch.$gte = new Date(criteria.createdAfter);
        if (criteria.createdBefore) dateMatch.$lte = new Date(criteria.createdBefore);
        match.createdAt = dateMatch;
    }

    // Status (if provided)
    if (criteria.status) {
        if (Array.isArray(criteria.status)) {
            const finalStatusList = criteria.status.map(s => normalizeAdStatus(s));
            match.status = { $in: Array.from(new Set(finalStatusList)) };
        } else {
            match.status = normalizeAdStatus(criteria.status);
        }
    }

    return match;
};
