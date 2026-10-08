import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import {
    objectIdSchema,
    emailSchema,
    priceSchema,
    coordinatesSchema,
    authMobileSchema,
} from '@esparex/contracts';

/**
 * Common validation schemas for reuse.
 *
 * SSOT: field-level schemas (objectId, mobile, email, price, coordinates)
 * are canonical in @esparex/contracts — this module re-exports them so
 * existing `commonSchemas.*` consumers delegate to the single owner.
 * Pagination/sort/search/dateRange below are Express query-string adapters
 * (string transforms) and intentionally remain here; the contracts
 * equivalents (paginationQuerySchema/sortQuerySchema/dateRangeSchema) use
 * coercion/Date semantics for wire payloads.
 */
export const commonSchemas = {
    /**
     * MongoDB ObjectId validation (canonical: contracts objectIdSchema).
     */
    objectId: objectIdSchema,

    /**
     * Pagination query params
     */
    pagination: z.object({
        page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
        limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
    }),

    /**
     * Sort query params
     */
    sort: z.object({
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),

    /**
     * Search query params
     */
    search: z.object({
        q: z.string().min(1).max(100).optional(),
    }),

    /**
     * Date range query params
     */
    dateRange: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }),

    /**
     * Mobile number validation (canonical: contracts authMobileSchema —
     * Indian 10-digit with +91/0 prefix normalization).
     */
    mobile: authMobileSchema,

    /**
     * Email validation (canonical: contracts emailSchema).
     */
    email: emailSchema,

    /**
     * URL validation
     */
    url: z.string().url('Invalid URL format').max(2048, 'URL too long'),

    /**
     * Price validation (canonical: contracts priceSchema, PRICE_LIMITS).
     */
    price: priceSchema,

    /**
     * Image URL validation
     */
    imageUrl: z.string().url().regex(/\.(jpg|jpeg|png|webp|gif)$/i, 'Invalid image format'),

    /**
     * Coordinates validation (canonical: contracts coordinatesSchema,
     * GeoJSON Point with [0,0] Null Island guard).
     */
    coordinates: coordinatesSchema,
};

/**
 * Create a sanitized string schema
 */
export function sanitizeString(min?: number, max?: number) {
    let schema = z.string();

    if (min !== undefined) {
        schema = schema.min(min);
    }

    if (max !== undefined) {
        schema = schema.max(max);
    }

    return schema.transform(val => sanitizeHtml(val, {
        allowedTags: [],
        allowedAttributes: {},
    }).trim());
}
