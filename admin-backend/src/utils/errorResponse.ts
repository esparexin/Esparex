import { Request, Response } from 'express';
import { ApiResponse } from './apiResponse';

type ErrorResponseOptions = {
    code?: string;
    details?: unknown;
    [key: string]: unknown;
};

/**
 * Strict error response contract - validated response format
 */
export interface ErrorResponseContract {
    success: false;
    error: string;
    status: number;
    path: string;
    code?: string;
    details?: Record<string, unknown>;
}

export const buildErrorResponse = (
    req: Request,
    status: number,
    error: string,
    options: ErrorResponseOptions = {}
) => {
    // Note: buildErrorResponse is used internally by middleware or tests.
    // For direct controller responses, use sendErrorResponse.
    const requestPath = req.originalUrl || req.path || 'unknown';
    return {
        success: false,
        error,
        path: requestPath,
        status,
        ...options
    };
};

export const sendErrorResponse = (
    req: Request,
    res: Response,
    status: number,
    error: string,
    options: ErrorResponseOptions = {}
) => {
    return ApiResponse.sendError(req, res, status, error, options);
};

/**
 * Unified error handler for catalog operations
 */
export function sendCatalogError(
    req: Request,
    res: Response,
    error: unknown,
    statusCodeOrOptions?: number | {
        statusCode?: number;
        fallbackMessage?: string;
        isAdminView?: boolean;
    }
) {
    let statusCode = 500;
    let fallbackMessage: string | undefined;
    let isAdminView = req.originalUrl?.includes('/admin') ?? false;

    if (typeof statusCodeOrOptions === 'number') {
        statusCode = statusCodeOrOptions;
    } else if (typeof statusCodeOrOptions === 'object' && statusCodeOrOptions !== null) {
        statusCode = statusCodeOrOptions.statusCode ?? 500;
        fallbackMessage = statusCodeOrOptions.fallbackMessage;
        isAdminView = statusCodeOrOptions.isAdminView ?? isAdminView;
    }

    if (isDuplicateKeyError(error)) {
        return sendErrorResponse(req, res, 400, 'Resource already exists', { isDuplicate: true });
    }

    if (isZodError(error)) {
        return sendErrorResponse(req, res, 400, 'Validation failed', { issues: normalizeZodIssues(error) });
    }

    if (isMongoError(error)) {
        return sendErrorResponse(req, res, 400, 'Database operation failed', { mongoError: (error as Error).message });
    }

    const message = typeof error === 'string' 
        ? (fallbackMessage || error)
        : (fallbackMessage || (isAdminView ? `Catalog operation failed: ${(error as Error)?.message || 'Unknown'}` : 'Not found'));

    return sendErrorResponse(req, res, statusCode, message);
}

function isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { code?: unknown; message?: unknown };
    return candidate.code === 11000 || (typeof candidate.message === 'string' && candidate.message.includes('E11000'));
}

type ZodIssueLike = { path: Array<string | number>; message: string; };

function isZodError(error: unknown): error is { issues: ZodIssueLike[] } {
    if (!error || typeof error !== 'object') return false;
    const issues = (error as Record<string, unknown>).issues;
    return Array.isArray(issues);
}

function isMongoError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { name?: string };
    return candidate.name === 'MongoError' || candidate.name === 'MongoServerError';
}

function normalizeZodIssues(error: { issues: ZodIssueLike[] }) {
    return error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}
