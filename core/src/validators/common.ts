import { z } from 'zod';

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
    /**
     * MongoDB ObjectId validation
     */
    objectId: z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format'),

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
     * Mobile number validation (Indian format, 10-digit storage — no prefix added)
     */
    mobile: z.string()
        .regex(/^[6-9]\d{9}$/, 'Invalid mobile number format'),

    /**
     * Email validation
     */
    email: z.string().email('Invalid email format').toLowerCase(),

    /**
     * URL validation
     */
    url: z.string().url('Invalid URL format'),

    /**
     * Price validation
     */
    price: z.number().min(0, 'Price must be positive').max(10000000, 'Price too high'),

    /**
     * Image URL validation
     */
    imageUrl: z.string().url().regex(/\.(jpg|jpeg|png|webp|gif)$/i, 'Invalid image format'),

    /**
     * Coordinates validation
     */
    coordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([
            z.number().min(-180).max(180),
            z.number().min(-90).max(90)
        ])
    }),
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

    return schema.transform(val => {
        let sanitized = val.replace(/<[^>]*>/g, '');
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        sanitized = sanitized.trim();
        return sanitized;
    });
}
