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
import { REPORT_REASON_VALUES } from '../../../shared/enums/reportReason';
import { coordinatesSchema } from '../../../shared/schemas/coordinates.schema';

/**
 * Ad status enum
 */
const adStatusEnum = z.enum(AD_STATUS_VALUES);

/**
 * Seller type enum
 */
const sellerTypeEnum = z.enum(['user', 'business']);



/**
 * Create Ad Request Schema
 */
export const createAdSchema = SharedAdPayloadSchema;

/**
 * Update Ad Request Schema
 */
export const updateAdSchema = SharedPartialAdPayloadSchema;

import { normalizeStatus } from '../../../shared/utils/statusNormalization';

/**
 * Get Ads Query Schema
 * Implements Naming Coercion (Clean-At-Gate)
 */
export const getAdsQuerySchema = commonSchemas.pagination.extend({
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
    
    // Naming Coercion: sellerId vs userId
    sellerId: commonSchemas.objectId.optional(),
    userId: commonSchemas.objectId.optional(),
    
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
}).transform((data: any) => {
    // Coerce userId -> sellerId if sellerId is missing
    if (data.userId && !data.sellerId) {
        data.sellerId = data.userId;
    }
    return data;
});

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

/**
 * Report Ad Schema
 */
export const reportAdSchema = z.object({
    reason: z.enum(REPORT_REASON_VALUES),
    description: z.string().max(500).transform(val => val.replace(/<[^>]*>/g, '').trim()).optional(),
}).strict();


export default {
    createAdSchema,
    updateAdSchema,
    getAdsQuerySchema,
    adIdParamSchema,
    markAsSoldSchema,
    reportAdSchema,
};
