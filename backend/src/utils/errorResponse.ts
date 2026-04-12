import { Request, Response } from 'express';

type ErrorResponseOptions = {
    code?: string;
    details?: unknown;
    [key: string]: unknown;
};

/**
 * Strict error response contract - validated response format
 * Ensures responses conform to expected shape with no extra fields
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
    const requestPath = req.originalUrl || req.path || 'unknown';
    const payload: Record<string, unknown> = {
        success: false,
        error,
        path: requestPath,
        status
    };

    if (options.code) payload.code = options.code;
    if (options.details !== undefined) payload.details = options.details;

    for (const [key, value] of Object.entries(options)) {
        if (key === 'code' || key === 'details') continue;
        payload[key] = value;
    }

    return payload;
};

export const sendErrorResponse = (
    req: Request,
    res: Response,
    status: number,
    error: string,
    options: ErrorResponseOptions = {}
) => {
    return res.status(status).json(buildErrorResponse(req, status, error, options));
};

/**
 * Unified error handler for catalog operations
 * Handles both admin and public views with consistent response format
 * 
 * Replaces parallel implementations of sendAdminError and sendErrorResponse
 * by providing single SSOT (Single Source of Truth) for error handling.
 * 
 * Backward compatible with sendAdminError(req, res, error, statusCode) signature.
 * 
 * @param req - Express request object
 * @param res - Express response object  
 * @param error - Unknown error to handle or error message string
 * @param statusCodeOrOptions - Status code (number, for legacy compat) or options object
 * @returns Http response with standardized error envelope
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
    // Parse statusCodeOrOptions to support both old and new signatures
    let statusCode = 500;
    let fallbackMessage: string | undefined;
    let isAdminView = (req as any).originalUrl?.includes('/admin') ?? false;

    if (typeof statusCodeOrOptions === 'number') {
        // Legacy: statusCodeOrOptions is a status code
        statusCode = statusCodeOrOptions;
    } else if (typeof statusCodeOrOptions === 'object' && statusCodeOrOptions !== null) {
        // New: statusCodeOrOptions is options object
        statusCode = statusCodeOrOptions.statusCode ?? 500;
        fallbackMessage = statusCodeOrOptions.fallbackMessage;
        isAdminView = statusCodeOrOptions.isAdminView ?? isAdminView;
    }

    // Check for duplicate key error
    if (isDuplicateKeyError(error)) {
        return sendErrorResponse(
            req,
            res,
            400,
            'Resource already exists',
            { isDuplicate: true }
        );
    }

    // Handle Zod validation errors
    if (isZodError(error)) {
        return sendErrorResponse(
            req,
            res,
            400,
            'Validation failed',
            { issues: normalizeZodIssues(error) }
        );
    }

    // Handle MongoDB errors
    if (isMongoError(error)) {
        return sendErrorResponse(
            req,
            res,
            400,
            'Database operation failed',
            { mongoError: (error as any).message }
        );
    }

    // If error is a string, use it as the message (legacy support)
    if (typeof error === 'string') {
        const message = fallbackMessage || error || (isAdminView ? 'Catalog operation failed' : 'Not found');
        return sendErrorResponse(req, res, statusCode, message);
    }

    // Default error response
    if (statusCode >= 500) {
        import('./logger').then(({ default: logger }) => {
            logger.error(`[CatalogError] 500 on ${req.originalUrl}:`, {
                error: error instanceof Error ? error.stack || error.message : error
            });
        }).catch(() => {});
    }

    const e = error as Error;
    const message = fallbackMessage || (isAdminView ? `Catalog operation failed: ${e?.message || 'Unknown server error'}` : 'Not found');
    return sendErrorResponse(req, res, statusCode, message);
}

// Helper functions
function isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { code?: unknown; message?: unknown };
    return candidate.code === 11000 || (typeof candidate.message === 'string' && candidate.message.includes('E11000'));
}

function isZodError(error: unknown): error is { issues: Array<{ path: string[] }> } {
    if (!error || typeof error !== 'object') return false;
    return 'issues' in error && Array.isArray((error as any).issues);
}

function isMongoError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { name?: string };
    return candidate.name === 'MongoError' || candidate.name === 'MongoServerError';
}

function normalizeZodIssues(error: any) {
    return error.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}
