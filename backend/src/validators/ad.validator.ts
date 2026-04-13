/**
 * Ad Validation Schemas
 * 
 * Zod schemas for validating ad-related requests
 * 
 * @module validators/ad.validator
 */

import { z } from 'zod';
import { commonSchemas } from '../middleware/validateRequest';
import {
    AdPayloadSchema as SharedAdPayloadSchema,
    PartialAdPayloadSchema as SharedPartialAdPayloadSchema
} from '../../../shared/schemas/adPayload.schema';
import { AD_STATUS_VALUES } from '../../../shared/enums/adStatus';

/**
 * Ad status enum
 */
const adStatusEnum = z.enum(AD_STATUS_VALUES);

/**
 * Seller type enum
 */
const sellerTypeEnum = z.enum(['user', 'business']);
const LEGACY_AD_USER_ID_ALIAS = 'userId';
const LEGACY_AD_USER_ID_ALIAS_MESSAGE = '`userId` is no longer accepted in ad query filters. Use `sellerId` instead.';

const hasOwn = (value: unknown, key: string): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));

const throwIfLegacyAdUserIdAliasPresent = (raw: unknown): void => {
    if (!hasOwn(raw, LEGACY_AD_USER_ID_ALIAS)) return;
    throw new z.ZodError([{
        code: z.ZodIssueCode.custom,
        path: [LEGACY_AD_USER_ID_ALIAS],
        message: LEGACY_AD_USER_ID_ALIAS_MESSAGE,
    }]);
};



/**
 * Create Ad Request Schema
 */
export const createAdSchema = SharedAdPayloadSchema;

/**
 * Update Ad Request Schema
 */
export const updateAdSchema = SharedPartialAdPayloadSchema.passthrough();

import { normalizeStatus } from '../../../shared/utils/statusNormalization';

/**
 * Get Ads Query Schema
 * Canonical ownership query key is sellerId.
 */
const getAdsQuerySchemaBase = commonSchemas.pagination.extend({
    ...commonSchemas.sort.shape,
    ...commonSchemas.search.shape,
    // Legacy alias kept for backward compatibility with older clients.
    search: z.string().min(1).max(100).optional(),

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

    // Legacy alias for categoryId (slug or name)
    category: z.string().max(100).optional(),

    minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),

    // Legacy text keys kept for backward compatibility only.
    location: z.string().max(120).optional(),
    city: z.string().max(50).optional(),
    state: z.string().max(50).optional(),

    isSpotlight: z.boolean().or(z.string().transform(val => val === 'true')).optional(),

    // 📍 New Location Filters
    radiusKm: z.string().transform(Number).pipe(z.number().min(0).max(500)).optional(),
    lat: z.string().transform(Number).pipe(z.number().min(-90).max(90)).optional(),
    lng: z.string().transform(Number).pipe(z.number().min(-180).max(180)).optional(),
    coordinates: z.any().optional(),
    cursor: commonSchemas.objectId.optional(),
});

export const getAdsQuerySchema = z.preprocess((raw) => {
    throwIfLegacyAdUserIdAliasPresent(raw);
    return raw;
}, getAdsQuerySchemaBase);

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
    adIdParamSchema,
    markAsSoldSchema,
};
