"use strict";
/**
 * Ad Validation Schemas
 *
 * Zod schemas for validating ad-related requests
 *
 * @module validators/ad.validator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsSoldSchema = exports.adIdParamSchema = exports.trendingAdsQuerySchema = exports.homeFeedQuerySchema = exports.getAdsQuerySchema = exports.updateAdSchema = exports.createAdSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const adPayload_schema_1 = require("@shared/schemas/adPayload.schema");
/**
 * Seller type enum
 */
const sellerTypeEnum = zod_1.z.enum(['user', 'business']);
const LEGACY_AD_USER_ID_ALIAS = 'userId';
const LEGACY_AD_USER_ID_ALIAS_MESSAGE = '`userId` is no longer accepted in ad query filters. Use `sellerId` instead.';
const LEGACY_AD_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in ad query filters. Use `q` instead.';
const LEGACY_AD_CATEGORY_ALIAS_MESSAGE = '`category` is no longer accepted in ad query filters. Use `categoryId` instead.';
const LEGACY_AD_LOCATION_ALIAS_MESSAGE = '`location` is no longer accepted in ad query filters. Use `locationId` or lat/lng/radiusKm instead.';
const LEGACY_AD_CITY_ALIAS_MESSAGE = '`city` is no longer accepted in ad query filters. Use `locationId` with `level`, or lat/lng/radiusKm instead.';
const LEGACY_AD_STATE_ALIAS_MESSAGE = '`state` is no longer accepted in ad query filters. Use `locationId` with `level`, or lat/lng/radiusKm instead.';
const hasOwn = (value, key) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));
const LEGACY_AD_QUERY_ALIAS_CONFIGS = [
    { alias: LEGACY_AD_USER_ID_ALIAS, message: LEGACY_AD_USER_ID_ALIAS_MESSAGE },
    { alias: 'search', message: LEGACY_AD_SEARCH_ALIAS_MESSAGE },
    { alias: 'category', message: LEGACY_AD_CATEGORY_ALIAS_MESSAGE },
    { alias: 'location', message: LEGACY_AD_LOCATION_ALIAS_MESSAGE },
    { alias: 'city', message: LEGACY_AD_CITY_ALIAS_MESSAGE },
    { alias: 'state', message: LEGACY_AD_STATE_ALIAS_MESSAGE },
];
const throwIfLegacyAdQueryAliasesPresent = (raw, aliases = LEGACY_AD_QUERY_ALIAS_CONFIGS) => {
    const issues = aliases
        .filter(({ alias }) => hasOwn(raw, alias))
        .map(({ alias, message }) => ({
        code: zod_1.z.ZodIssueCode.custom,
        path: [alias],
        message,
    }));
    if (issues.length === 0)
        return;
    throw new zod_1.z.ZodError(issues);
};
/**
 * Create Ad Request Schema
 */
exports.createAdSchema = adPayload_schema_1.AdPayloadSchema;
/**
 * Update Ad Request Schema
 */
exports.updateAdSchema = adPayload_schema_1.PartialAdPayloadSchema.passthrough();
const statusNormalization_1 = require("@shared/utils/statusNormalization");
/**
 * Get Ads Query Schema
 * Canonical ownership query key is sellerId.
 */
const getAdsQuerySchemaBase = common_1.commonSchemas.pagination.extend({
    ...common_1.commonSchemas.sort.shape,
    ...common_1.commonSchemas.search.shape,
    status: zod_1.z.preprocess((val) => (0, statusNormalization_1.normalizeStatus)(val), zod_1.z.string()).optional(),
    // SSOT: Canonical filter key is categoryId.
    categoryId: common_1.commonSchemas.objectId.optional(),
    brandId: common_1.commonSchemas.objectId.optional(),
    modelId: common_1.commonSchemas.objectId.optional(),
    locationId: common_1.commonSchemas.objectId.optional(),
    level: zod_1.z.enum(['country', 'state', 'district', 'city', 'area', 'village']).optional(),
    // Canonical ownership filter
    sellerId: common_1.commonSchemas.objectId.optional(),
    sellerType: sellerTypeEnum.optional(),
    minPrice: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).optional(),
    maxPrice: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0)).optional(),
    isSpotlight: zod_1.z.boolean().or(zod_1.z.string().transform(val => val === 'true')).optional(),
    // 📍 New Location Filters
    radiusKm: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0).max(500)).optional(),
    lat: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(-90).max(90)).optional(),
    lng: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(-180).max(180)).optional(),
    coordinates: zod_1.z.any().optional(),
    cursor: common_1.commonSchemas.objectId.optional(),
});
exports.getAdsQuerySchema = zod_1.z.preprocess((raw) => {
    throwIfLegacyAdQueryAliasesPresent(raw);
    return raw;
}, getAdsQuerySchemaBase);
const feedLocationSchema = zod_1.z.object({
    locationId: common_1.commonSchemas.objectId.optional(),
    level: zod_1.z.enum(['country', 'state', 'district', 'city', 'area', 'village']).optional(),
    radiusKm: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0).max(500)).optional(),
    lat: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(-90).max(90)).optional(),
    lng: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(-180).max(180)).optional(),
});
const homeFeedQuerySchemaBase = feedLocationSchema.extend({
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(1).max(48)).optional(),
    cursor: zod_1.z.string().min(1).optional(),
    cursorId: common_1.commonSchemas.objectId.optional(),
    categoryId: common_1.commonSchemas.objectId.optional(),
});
exports.homeFeedQuerySchema = zod_1.z.preprocess((raw) => {
    throwIfLegacyAdQueryAliasesPresent(raw, [
        { alias: 'category', message: LEGACY_AD_CATEGORY_ALIAS_MESSAGE },
        { alias: 'location', message: LEGACY_AD_LOCATION_ALIAS_MESSAGE },
        { alias: 'city', message: LEGACY_AD_CITY_ALIAS_MESSAGE },
        { alias: 'state', message: LEGACY_AD_STATE_ALIAS_MESSAGE },
    ]);
    return raw;
}, homeFeedQuerySchemaBase);
const trendingAdsQuerySchemaBase = zod_1.z.object({
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(1).max(20)).optional(),
    locationId: common_1.commonSchemas.objectId.optional(),
    categoryId: common_1.commonSchemas.objectId.optional(),
});
exports.trendingAdsQuerySchema = zod_1.z.preprocess((raw) => {
    throwIfLegacyAdQueryAliasesPresent(raw, [
        { alias: 'category', message: LEGACY_AD_CATEGORY_ALIAS_MESSAGE },
        { alias: 'location', message: LEGACY_AD_LOCATION_ALIAS_MESSAGE },
    ]);
    return raw;
}, trendingAdsQuerySchemaBase);
/**
 * Ad ID Param Schema
 */
exports.adIdParamSchema = zod_1.z.object({
    id: common_1.commonSchemas.objectId,
});
/**
 * Mark Ad as Sold Schema
 */
exports.markAsSoldSchema = zod_1.z.object({
    soldAt: zod_1.z.string().datetime().optional(),
    soldReason: zod_1.z.enum(['sold_on_platform', 'sold_outside', 'no_longer_available']).optional(),
}).strict().default({});
exports.default = {
    createAdSchema: exports.createAdSchema,
    updateAdSchema: exports.updateAdSchema,
    getAdsQuerySchema: exports.getAdsQuerySchema,
    homeFeedQuerySchema: exports.homeFeedQuerySchema,
    trendingAdsQuerySchema: exports.trendingAdsQuerySchema,
    adIdParamSchema: exports.adIdParamSchema,
    markAsSoldSchema: exports.markAsSoldSchema,
};
//# sourceMappingURL=ad.validator.js.map