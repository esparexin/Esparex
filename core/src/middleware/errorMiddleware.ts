import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { env } from '@core/config/env';
import logger from '@core/utils/logger';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { AuditLogService } from '@core/services/AuditService';
import { AlertService } from '@core/services/AlertService';
import { TraceContext } from '@shared/observability/trace';

export interface AppError extends Error {
    statusCode?: number;
    status?: number;
    details?: unknown;
    code?: string | number;
    path?: string;
}

const getUserId = (req: any): string | undefined => {
    return req.user?.id || req.user?._id?.toString();
};

const resolveConflictType = (code: string | undefined): string => {
    if (typeof code === 'string' && code.startsWith('IDEMPOTENCY_')) {
        return 'IDEMPOTENCY';
    }
    return 'DUPLICATE_AD';
};

/**
 * Sentry Request Handler Shim
 */
export function sentryRequestHandler(req: Request, res: Response, next: NextFunction) {
    if (!env.SENTRY_DSN) return next();
    
    Sentry.setContext('request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
    });

    const userId = getUserId(req);
    if (userId) {
        Sentry.setUser({ id: userId });
    }
    next();
}

/**
 * Sentry Tracing Handler Shim
 */
export function sentryTracingHandler(req: Request, res: Response, next: NextFunction) {
    if (!env.SENTRY_DSN) return next();
    Sentry.addBreadcrumb({
        category: 'http',
        message: `${req.method} ${req.url}`,
        level: 'info'
    });
    next();
}

/**
 * Global Error Handler Middleware (SSOT)
 */
export function globalErrorHandler(
    err: AppError,
    req: any,
    res: Response,
    next: NextFunction
) {
    const statusCode = err.statusCode || err.status || 500;
    const traceId = TraceContext.getCorrelationId();
    const userId = getUserId(req);

    // 1. JSON Logging
    logger.error('Request Exception', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        userId,
        traceId,
        statusCode
    });

    // 2. Audit & Alert Critical System Errors
    if (statusCode >= 500) {
        // Persistent Audit
        AuditLogService.logEvent(
            {
                action: 'SYSTEM_ERROR_CRITICAL',
                targetType: 'System',
                metadata: { message: err.message, path: req.url }
            },
            { actorId: userId, actorType: 'system', requestId: traceId }
        ).catch(() => {});

        // Real-time Alerting
        AlertService.captureError(req.serviceName || 'unknown-service', err, statusCode);
    }

    // 3. Sentry Integration
    if (env.SENTRY_DSN && statusCode >= 500) {
        Sentry.captureException(err, { extra: { traceId, url: req.url } });
    }

    // 4. Handle Specific Error Types Consistently
    
    // Zod Validation
    if (err instanceof ZodError) {
        const structuredErrors = Object.fromEntries(
            err.issues.map((issue) => [issue.path.join('.') || '_root', issue.message])
        );
        return sendErrorResponse(req, res, 400, 'Validation Error', {
            code: 'VALIDATION_ERROR',
            errors: structuredErrors,
            traceId
        });
    }

    // Database / Mongoose
    if (err.name === 'CastError') {
        return sendErrorResponse(req, res, 400, `Invalid ${err.path || 'reference'} value`, { code: 'INVALID_REFERENCE', traceId });
    }

    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        return sendErrorResponse(req, res, 409, 'A duplicate record was detected.', {
            code: 'DUPLICATE_RECORD',
            conflictType: resolveConflictType('DUPLICATE_RECORD'),
            traceId
        });
    }

    // 5. Final Response
    const message = statusCode >= 500 && env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'An error occurred';

    return sendErrorResponse(req, res, statusCode, message, {
        code: err.code ? String(err.code) : 'INTERNAL_ERROR',
        traceId,
        ...(env.NODE_ENV === 'development' && { stack: err.stack, details: err.details })
    });
}

export default {
    sentryRequestHandler,
    sentryTracingHandler,
    globalErrorHandler
};
