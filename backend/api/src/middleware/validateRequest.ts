/**
 * Request Validation Middleware
 * 
 * Provides Zod-based request validation for Express routes
 * Validates request body, query params, and route params
 * 
 * @module middleware/validateRequest
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { buildErrorResponse } from "@esparex/core/utils/errorResponse";
import logger from '@esparex/core/utils/logger';
import { commonSchemas, sanitizeString } from '@esparex/core/validators/common';

export { commonSchemas, sanitizeString };

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
    typeof value === 'object' && value !== undefined && !Array.isArray(value);

const assignValidatedTarget = (
    req: Request,
    target: ValidationTarget,
    validated: unknown
) => {
    const mutableReq = req as Request & Record<string, unknown>;

    const current: unknown = mutableReq[target];
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
 */
export function validateRequest(
    schema: ZodSchema | ValidationSchema,
    target: ValidationTarget = 'body'
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if ('parse' in schema) {
                const validated: unknown = await (schema as { parseAsync: (data: unknown) => Promise<unknown> }).parseAsync(req[target] as unknown);
                assignValidatedTarget(req, target, validated);
                return next();
            }

            const schemas = schema;

            if (schemas.body) {
                const parsedBody: unknown = await schemas.body.parseAsync(req.body);
                assignValidatedTarget(req, 'body', parsedBody);
            }

            if (schemas.query) {
                const parsedQuery: unknown = await schemas.query.parseAsync(req.query);
                assignValidatedTarget(req, 'query', parsedQuery);
            }

            if (schemas.params) {
                const parsedParams: unknown = await schemas.params.parseAsync(req.params);
                assignValidatedTarget(req, 'params', parsedParams);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError || isZodLikeError(error)) {
                const payload = formatZodError(req, error as ZodLikeError);
                logger.warn(`[Validation Failed] ${req.method} ${req.path}`, JSON.stringify(payload));
                return res.status(400).json(payload);
            }

            logger.error('Validation middleware error:', error);
            return res.status(500).json(buildErrorResponse(req, 500, 'Internal validation error'));
        }
    };
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

            if (file.size > maxSize) {
                return res.status(400).json(buildErrorResponse(
                    req,
                    400,
                    `File ${file.originalname} exceeds maximum size of ${maxSize / 1024 / 1024}MB`
                ));
            }

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
