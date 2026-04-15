/**
 * Request Validation Middleware
 * 
 * Provides Zod-based request validation for Express routes
 * Validates request body, query params, and route params
 * 
 * @module middleware/validateRequest
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { buildErrorResponse } from '../utils/errorResponse';
import logger from '../utils/logger';

/**
 * Validation target (what to validate)
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validation schema configuration
 */
interface ValidationSchema {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const assignValidatedTarget = (
    req: Request,
    target: ValidationTarget,
    validated: unknown
) => {
    const mutableReq = req as Request & Record<string, unknown>;

    // Express may expose read-only getters for query/params in some runtimes.
    // Prefer in-place mutation when both current and validated values are plain objects.
    const current = mutableReq[target];
    if (isPlainRecord(current) && isPlainRecord(validated)) {
        Object.keys(current).forEach((key) => {
            delete current[key];
        });
        Object.assign(current, validated);
        return;
    }

    try {
        mutableReq[target] = validated;
    } catch (error) {
        // Final fallback for read-only descriptors.
        if (target === 'query' && isPlainRecord(validated)) {
            Object.defineProperty(req, 'query', {
                value: validated,
                writable: true,
                configurable: true,
                enumerable: true
            });
            return;
        }
        throw error;
    }
};

/**
 * Format Zod validation errors for API response
 */
type ZodLikeIssue = {
    path: Array<string | number>;
    message: string;
    code: string;
};

type ZodLikeError = {
    errors?: ZodLikeIssue[];
    issues?: ZodLikeIssue[];
};

const isZodLikeError = (error: unknown): error is ZodLikeError => {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { errors?: unknown; issues?: unknown };
    return Array.isArray(candidate.errors) || Array.isArray(candidate.issues);
};

function formatZodError(req: Request, error: ZodLikeError) {
    const issues = Array.isArray(error.errors)
        ? error.errors
        : (Array.isArray(error.issues) ? error.issues : []);
    return buildErrorResponse(req, 400, 'Validation failed', {
        details: issues.map(err => ({
            field: Array.isArray(err.path) ? err.path.join('.') : '',
            message: err.message,
            code: err.code,
        })),
    });
}

/**
 * Request validation middleware factory
 * 
 * @param schema - Zod schema or validation configuration
 * @param target - What to validate (defaults to 'body')
 * @returns Express middleware function
 */
export function validateRequest(
    schema: ZodSchema | ValidationSchema,
    target: ValidationTarget = 'body'
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Handle single schema (backward compatible)
            if ('parse' in schema) {
                const validated = await schema.parseAsync(req[target]);
                assignValidatedTarget(req, target, validated);
                return next();
            }

            // Handle multiple schemas
            const schemas = schema;

            if (schemas.body) {
                assignValidatedTarget(req, 'body', await schemas.body.parseAsync(req.body));
            }

            if (schemas.query) {
                assignValidatedTarget(req, 'query', await schemas.query.parseAsync(req.query));
            }

            if (schemas.params) {
                assignValidatedTarget(req, 'params', await schemas.params.parseAsync(req.params));
            }

            next();
        } catch (error) {
            if (error instanceof ZodError || isZodLikeError(error)) {
                // Log validation errors for security monitoring
                const payload = formatZodError(req, error as ZodLikeError);
                logger.warn(`[Validation Failed] ${req.method} ${req.path}`, JSON.stringify(payload));
                return res.status(400).json(payload);
            }

            // Unexpected error
            logger.error('Validation middleware error:', error);
            return res.status(500).json(buildErrorResponse(req, 500, 'Internal validation error'));
        }
    };
}

/**
 * Common validation schemas for reuse
 * 
 * VALIDATION SSOT NOTE:
 * These schemas mirror shared/schemas/common.schemas.ts.
 * Direct import avoided due to Zod instance boundary across monorepo packages.
 * Behavior must remain identical to the canonical SSOT.
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
        .regex(/^[6-9]\d{9}$/, 'Invalid phone number format'),

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
     // VALIDATION SSOT NOTE:
    // This schema mirrors shared/schemas/coordinates.schema.ts.
    // Direct import avoided due to Zod instance boundary.
    // Behavior must remain identical to canonical SSOT.
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
 * Removes HTML tags and dangerous characters
 * 
 * @param min - Minimum length (optional)
 * @param max - Maximum length
 * @returns Zod string schema with sanitization
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
        // Remove HTML tags
        let sanitized = val.replace(/<[^>]*>/g, '');

        // Remove script tags and event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

        // Trim whitespace
        sanitized = sanitized.trim();

        return sanitized;
    });
}

/**
 * Validate file upload
 */
export function validateFile(options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
} = {}) {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.file && !req.files) {
            return next();
        }

        const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

        for (const file of files) {
            if (!file) continue;

            // Check file size
            if (file.size > maxSize) {
                return res.status(400).json(buildErrorResponse(
                    req,
                    400,
                    `File ${file.originalname} exceeds maximum size of ${maxSize / 1024 / 1024}MB`
                ));
            }

            // Check file type
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json(buildErrorResponse(
                    req,
                    400,
                    `File ${file.originalname} has invalid type. Allowed: ${allowedTypes.join(', ')}`
                ));
            }
        }

        next();
    };
}

export default validateRequest;
