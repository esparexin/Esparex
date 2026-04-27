"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemas = void 0;
exports.sanitizeString = sanitizeString;
const zod_1 = require("zod");
/**
 * Common validation schemas for reuse
 */
exports.commonSchemas = {
    /**
     * MongoDB ObjectId validation
     */
    objectId: zod_1.z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format'),
    /**
     * Pagination query params
     */
    pagination: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(1)).default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().min(1).max(100)).default('20'),
    }),
    /**
     * Sort query params
     */
    sort: zod_1.z.object({
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
    /**
     * Search query params
     */
    search: zod_1.z.object({
        q: zod_1.z.string().min(1).max(100).optional(),
    }),
    /**
     * Date range query params
     */
    dateRange: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
    /**
     * Mobile number validation (Indian format, 10-digit storage — no prefix added)
     */
    mobile: zod_1.z.string()
        .regex(/^[6-9]\d{9}$/, 'Invalid mobile number format'),
    /**
     * Email validation
     */
    email: zod_1.z.string().email('Invalid email format').toLowerCase(),
    /**
     * URL validation
     */
    url: zod_1.z.string().url('Invalid URL format'),
    /**
     * Price validation
     */
    price: zod_1.z.number().min(0, 'Price must be positive').max(10000000, 'Price too high'),
    /**
     * Image URL validation
     */
    imageUrl: zod_1.z.string().url().regex(/\.(jpg|jpeg|png|webp|gif)$/i, 'Invalid image format'),
    /**
     * Coordinates validation
     */
    coordinates: zod_1.z.object({
        type: zod_1.z.literal('Point'),
        coordinates: zod_1.z.tuple([
            zod_1.z.number().min(-180).max(180),
            zod_1.z.number().min(-90).max(90)
        ])
    }),
};
/**
 * Create a sanitized string schema
 */
function sanitizeString(min, max) {
    let schema = zod_1.z.string();
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
//# sourceMappingURL=common.js.map