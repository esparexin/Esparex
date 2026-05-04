/**
 * Ad Validation Schemas
 * 
 * Zod schemas for validating ad-related requests
 * 
 * @module validators/ad.validator
 */

import { z } from 'zod';
import { commonSchemas } from './common';
import {
    AdPayloadSchema as SharedAdPayloadSchema,
    PartialAdPayloadSchema as SharedPartialAdPayloadSchema
} from "@esparex/shared/schemas/adPayload.schema";

/**
 * Seller type enum
 */
const sellerTypeEnum = z.enum(['user', 'business']);
const LEGACY_AD_USER_ID_ALIAS = 'userId';
const LEGACY_AD_USER_ID_ALIAS_MESSAGE = '`userId` is no longer accepted in ad query filters. Use `sellerId` instead.';
const LEGACY_AD_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in ad query filters. Use `q` instead.';
const LEGACY_AD_CATEGORY_ALIAS_MESSAGE = '`category` is no longer accepted in ad query filters. Use `categoryId` instead.';
const LEGACY_AD_LOCATION_ALIAS_MESSAGE = '`location` is no longer accepted in ad query filters. Use `locationId` or lat/lng/radiusKm instead.';
const LEGACY_AD_CITY_ALIAS_MESSAGE = '`city` is no longer accepted in ad query filters. Use `locationId` with `level`, or lat/lng/radiusKm instead.';
const LEGACY_AD_STATE_ALIAS_MESSAGE = '`state` is no longer accepted in ad query filters. Use `locationId` with `level`, or lat/lng/radiusKm instead.';

const hasOwn = (value: unknown, key: string): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));

type LegacyAliasConfig = {
    alias: string;
    message: string;
};

const LEGACY_AD_QUERY_ALIAS_CONFIGS: LegacyAliasConfig[] = [
    { alias: LEGACY_AD_USER_ID_ALIAS, message: LEGACY_AD_USER_ID_ALIAS_MESSAGE },
    { alias: 'search', message: LEGACY_AD_SEARCH_ALIAS_MESSAGE },
    { alias: 'category', message: LEGACY_AD_CATEGORY_ALIAS_MESSAGE },
    { alias: 'location', message: LEGACY_AD_LOCATION_ALIAS_MESSAGE },
    { alias: 'city', message: LEGACY_AD_CITY_ALIAS_MESSAGE },
    { alias: 'state', message: LEGACY_AD_STATE_ALIAS_MESSAGE },
];

const throwIfLegacyAdQueryAliasesPresent = (
    raw: unknown,
    aliases: LegacyAliasConfig[] = LEGACY_AD_QUERY_ALIAS_CONFIGS
): void => {
    const issues = aliases
        .filter(({ alias }) => hasOwn(raw, alias))
        .map(({ alias, message }) => ({
            code: z.ZodIssueCode.custom,
            path: [alias],
            message,
        }));

    if (issues.length === 0) return;
    throw new z.ZodError(issues);
};



/**
 * Create Ad Request Schema
 */
export const createAdSchema = SharedAdPayloadSchema;

/**
 * Update Ad Request Schema
 */
export const updateAdSchema = SharedPartialAdPayloadSchema.passthrough();

import { normalizeStatus } from "@esparex/shared/utils/statusNormalization";

/**
 * Get Ads Query Schema
 * Canonical ownership query key is sellerId.
 */
const getAdsQuerySchemaBase = commonSchemas.pagination.extend({
    ...commonSchemas.sort.shape,
    ...commonSchemas.search.shape,
    status: z.preprocess((val) => normalizeStatus(val), z.string()).optional(),
    
    // SSOT: Canonical filter key is categoryId.
    categoryId: commonSchemas.objectId.optional(),
    brandId: commonSchemas.objectId.optional(),
    modelId: commonSchemas.objectId.optional(),
    locationId: commonSchemas.objectId.optional(),
    level: z.enum(['country', 'state', 'district', 'city', 'area', 'village']).optional(),
    
    // Canonical ownership filter
    sellerId: commonSchemas.objectId.optional(),
    
    sellerType: sellerTypeEnum.optional(),

    minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),

    isSpotlight: z.boolean().or(z.string().transform(val => val === 'true')).optional(),
    listingType: z.string().optional(),

    // 📍 New Location Filters
    radiusKm: z.string().transform(Number).pipe(z.number().min(0).max(500)).optional(),
    lat: z.string().transform(Number).pipe(z.number().min(-90).max(90)).optional(),
    lng: z.string().transform(Number).pipe(z.number().min(-180).max(180)).optional(),
    coordinates: z.any().optional(),
    cursor: commonSchemas.objectId.optional(),
});

export const getAdsQuerySchema = z.preprocess((raw) => {
    throwIfLegacyAdQueryAliasesPresent(raw);
    return raw;
}, getAdsQuerySchemaBase);

const feedLocationSchema = z.object({
    locationId: commonSchemas.objectId.optional(),
    level: z.enum(['country', 'state', 'district', 'city', 'area', 'village']).optional(),
    radiusKm: z.string().transform(Number).pipe(z.number().min(0).max(500)).optional(),
    lat: z.string().transform(Number).pipe(z.number().min(-90).max(90)).optional(),
    lng: z.string().transform(Number).pipe(z.number().min(-180).max(180)).optional(),
});

const homeFeedQuerySchemaBase = feedLocationSchema.extend({
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(48)).optional(),
    cursor: z.string().min(1).optional(),
    cursorId: commonSchemas.objectId.optional(),
    categoryId: commonSchemas.objectId.optional(),
});

export const homeFeedQuerySchema = z.preprocess((raw) => {
    throwIfLegacyAdQueryAliasesPresent(raw, [
        { alias: 'category', message: LEGACY_AD_CATEGORY_ALIAS_MESSAGE },
        { alias: 'location', message: LEGACY_AD_LOCATION_ALIAS_MESSAGE },
        { alias: 'city', message: LEGACY_AD_CITY_ALIAS_MESSAGE },
        { alias: 'state', message: LEGACY_AD_STATE_ALIAS_MESSAGE },
    ]);
    return raw;
}, homeFeedQuerySchemaBase);

const trendingAdsQuerySchemaBase = z.object({
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(20)).optional(),
    locationId: commonSchemas.objectId.optional(),
    categoryId: commonSchemas.objectId.optional(),
});

export const trendingAdsQuerySchema = z.preprocess((raw) => {
    throwIfLegacyAdQueryAliasesPresent(raw, [
        { alias: 'category', message: LEGACY_AD_CATEGORY_ALIAS_MESSAGE },
        { alias: 'location', message: LEGACY_AD_LOCATION_ALIAS_MESSAGE },
    ]);
    return raw;
}, trendingAdsQuerySchemaBase);

/**
 * Ad ID Param Schema
 */
export const adIdParamSchema = z.object({
    id: commonSchemas.objectId,
});

/**
 * Mark Ad as Sold Schema
 */
export const markAsSoldSchema = z.object({
    soldAt: z.string().datetime().optional(),
    soldReason: z.enum(['sold_on_platform', 'sold_outside', 'no_longer_available']).optional(),
}).strict().default({});

export default {
    createAdSchema,
    updateAdSchema,
    getAdsQuerySchema,
    homeFeedQuerySchema,
    trendingAdsQuerySchema,
    adIdParamSchema,
    markAsSoldSchema,
};
