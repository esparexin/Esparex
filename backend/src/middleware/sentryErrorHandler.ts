/**
 * Sentry Error Handler Middleware
 * 
 * Express middleware to capture errors in Sentry.
 * Should be added AFTER all routes but BEFORE other error handlers.
 * 
 * @module middleware/sentryErrorHandler
 */

import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { env } from '../config/env';
import logger from '../utils/logger';
import { sendErrorResponse } from '../utils/errorResponse';
import { ZodError } from 'zod';

type RequestUser = {
    id?: string;
    _id?: string | { toString: () => string };
    email?: string;
    role?: string;
};

type RequestWithUser = Request & {
    user?: RequestUser;
    requestId?: string;
};

type AppError = Error & {
    statusCode?: number;
    status?: number;
    stack?: string;
    details?: unknown;
    code?: string | number;
    path?: string;
    keyPattern?: Record<string, unknown>;
};

type ConflictType = 'IDEMPOTENCY' | 'DUPLICATE_AD';

const getUserId = (req: RequestWithUser): string | undefined => {
    if (typeof req.user?.id === 'string') return req.user.id;
    const raw = req.user?._id;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw.toString === 'function') return raw.toString();
    return undefined;
};

const resolveConflictType = (code: string | undefined): ConflictType => {
    if (typeof code === 'string' && code.startsWith('IDEMPOTENCY_')) {
        return 'IDEMPOTENCY';
    }
    return 'DUPLICATE_AD';
};

/**
 * Sentry request handler middleware
 * Adds request context to Sentry events
 * 
 * @example
 * app.use(sentryRequestHandler);
 */
export function sentryRequestHandler(req: Request, res: Response, next: NextFunction) {
    void res;
    if (!env.SENTRY_DSN) {
        return next();
    }

    const authReq = req as RequestWithUser;

    // Set request context
    Sentry.setContext('request', {
        method: authReq.method,
        url: authReq.url,
        headers: authReq.headers,
        query: authReq.query,
    });

    // Set user if available
    if (authReq.user) {
        Sentry.setUser({
            id: getUserId(authReq),
            email: authReq.user.email,
            role: authReq.user.role,
        });
    }

    next();
}

/**
 * Sentry tracing handler middleware
 * Enables performance monitoring for requests
 * 
 * @example
 * app.use(sentryTracingHandler);
 */
export function sentryTracingHandler(req: Request, res: Response, next: NextFunction) {
    void res;
    if (!env.SENTRY_DSN) {
        return next();
    }

    // Add breadcrumb for request
    Sentry.addBreadcrumb({
        category: 'http',
        message: `${req.method} ${req.url}`,
        level: 'info',
        data: {
            method: req.method,
            url: req.url,
            query: req.query,
        },
    });

    next();
}

/**
 * Sentry error handler middleware
 * Captures errors and sends them to Sentry
 * 
 * @example
 * app.use(sentryErrorHandler);
 */
export function sentryErrorHandler(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    void res;
    if (!env.SENTRY_DSN) {
        return next(err);
    }

    const authReq = req as RequestWithUser;

    // Capture error in Sentry
    if (err.statusCode && err.statusCode >= 500) {
        Sentry.captureException(err, {
            extra: {
                method: authReq.method,
                url: authReq.url,
                body: authReq.body,
                query: authReq.query,
                params: authReq.params,
                userId: getUserId(authReq),
            },
        });
    }

    next(err);
}

/**
 * Custom error handler that works with Sentry
 * Provides consistent error responses and logging
 * 
 * @example
 * app.use(customErrorHandler);
 */
export function customErrorHandler(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) {
    void next;
    const authReq = req as RequestWithUser;

    // Log error
    logger.error('Request error', {
        error: err.message,
        stack: err.stack,
        method: authReq.method,
        url: authReq.url,
        userId: getUserId(authReq),
        requestId: authReq.requestId,
    });

    // Global Zod Validation Middleware
    if (err instanceof ZodError) {
        const structuredErrors = Object.fromEntries(
            err.issues.map((issue) => [
                issue.path.join('.') || '_root',
                issue.message,
            ])
        );
        return sendErrorResponse(req, res, 400, 'Validation Error', {
            code: 'VALIDATION_ERROR',
            errors: structuredErrors,
            requestId: authReq.requestId
        });
    }

    // Global Mongoose Error Catching
    if (err.name === 'CastError') {
        return sendErrorResponse(req, res, 400, `Invalid ${err.path || 'reference'} value`, {
            code: 'INVALID_REFERENCE',
            requestId: authReq.requestId
        });
    }

    if (err.name === 'ValidationError') {
        return sendErrorResponse(req, res, 400, 'Data Validation Error', {
            code: 'VALIDATION_ERROR',
            details: err.message,
            requestId: authReq.requestId
        });
    }

    // Global Multer / File Upload Error Handling
    if (
        err.name === 'MulterError' ||
        err.code === 'INVALID_UPLOAD_TYPE' ||
        (err.message && /^invalid .*type:/i.test(err.message))
    ) {
        const message = err.name === 'MulterError' ? `Upload failed: ${err.message}` : err.message;
        const code = err.name === 'MulterError'
            ? `UPLOAD_${(err as { code?: string }).code || 'ERROR'}`
            : ((err.code as string | undefined) || 'INVALID_FILE_TYPE');
        
        return sendErrorResponse(req, res, 400, message, {
            code,
            requestId: authReq.requestId,
            ...(env.NODE_ENV === 'development' && { details: err.stack })
        });
    }

    const isMongoDuplicateKey =
        err.code === 11000 ||
        (err.message && (err.message.includes('E11000') || err.message.toLowerCase().includes('duplicate key')));

    if (isMongoDuplicateKey) {
        const code = 'DUPLICATE_AD';
        return sendErrorResponse(req, res, 409, 'A duplicate record was detected.', {
            code,
            message: 'A duplicate record was detected.',
            conflictType: resolveConflictType(code),
            requestId: authReq.requestId
        });
    }

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    const errorCode = typeof err.code === 'string' && err.code.trim().length > 0
        ? err.code
        : undefined;
    const safeDetails = statusCode < 500 ? err.details : undefined;

    // Don't expose internal errors in production
    const message = statusCode >= 500 && env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'An error occurred';

    if (statusCode === 409) {
        const conflictCode = typeof err.code === 'string' && err.code.trim().length > 0
            ? err.code
            : 'CONFLICT';
        return sendErrorResponse(req, res, 409, message, {
            code: conflictCode,
            message,
            conflictType: resolveConflictType(conflictCode),
            requestId: authReq.requestId,
            ...(env.NODE_ENV === 'development' && {
                stack: err.stack,
                details: err.details,
            }),
        });
    }

    sendErrorResponse(req, res, statusCode, message, {
        ...(errorCode ? { code: errorCode } : {}),
        ...(safeDetails !== undefined ? { details: safeDetails } : {}),
        ...(env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err.details,
        }),
        requestId: authReq.requestId,
    });
}

export default {
    sentryRequestHandler,
    sentryTracingHandler,
    sentryErrorHandler,
    customErrorHandler,
};
