/**
 * Error Handling Utilities - Unified approach to error classification and extraction
 * Provides consistent error detail extraction across the codebase
 * 
 * Used for:
 * - Type-safe error checking
 * - Extracting error details consistently
 * - Adding context to errors before rethrowing
 * - Normalizing error messages
 */

/**
 * Type guard: Check if value is an Error instance
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

/**
 * Type guard: Check for MongoDB error
 */
export function isMongoError(error: unknown): error is Error & { code?: string | number } {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as any;
    return (
        candidate instanceof Error ||
        candidate.name === 'MongoError' ||
        candidate.name === 'MongoServerError' ||
        candidate.code === 11000 ||
        (typeof candidate.message === 'string' && candidate.message.includes('E11000'))
    );
}

/**
 * Type guard: Check for Zod validation error
 */
export function isZodError(error: unknown): error is { issues: Array<{ path: string[] }> } {
    if (!error || typeof error !== 'object') return false;
    return 'issues' in error && Array.isArray((error as any).issues);
}

/**
 * Type guard: Check for validation error from various validators
 */
export function isValidationError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as any;
    return (
        candidate instanceof Error && candidate.name === 'ValidationError' ||
        candidate instanceof Error && candidate.name === 'ZodError' ||
        Boolean(candidate.issues) ||
        Boolean(candidate.validationErrors)
    );
}

/**
 * Extract standard error details from any error type
 * Returns normalized error information suitable for logging
 */
export function extractErrorDetails(error: unknown): {
    message: string;
    stack?: string;
    code?: string | number;
    details?: unknown;
} {
    if (isError(error)) {
        return {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
            details: (error as any).details
        };
    }

    if (typeof error === 'string') {
        return { message: error };
    }

    if (typeof error === 'object' && error !== null) {
        return {
            message: (error as any).message || JSON.stringify(error),
            code: (error as any).code,
            details: error
        };
    }

    return { message: String(error) };
}

/**
 * Add context to an error before rethrowing
 * Preserves original error while adding layer-specific context
 */
export function contextualizeError(error: unknown, context: string): Error {
    const details = extractErrorDetails(error);
    const contextError = isError(error) ? error : new Error(details.message);
    contextError.message = `${context}: ${details.message}`;
    return contextError;
}

/**
 * Get normalized error message suitable for user-facing responses
 */
export function getNormalizedErrorMessage(
    error: unknown,
    fallback = 'An unexpected error occurred'
): string {
    if (isError(error)) {
        return error.message || fallback;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (typeof error === 'object' && error !== null) {
        return (error as any).message || fallback;
    }

    return fallback;
}

/**
 * Check if error is a duplicate key error (E11000)
 */
export function isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as any;
    return (
        candidate.code === 11000 ||
        (typeof candidate.message === 'string' && candidate.message.includes('E11000'))
    );
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as any;
    return (
        candidate.message?.includes('timeout') ||
        candidate.message?.includes('TIMEOUT') ||
        candidate.code === 'ETIMEDOUT' ||
        candidate.code === 'EHOSTUNREACH'
    );
}

/**
 * Check if error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as any;
    return (
        candidate.code?.includes('ECONNREFUSED') ||
        candidate.code?.includes('ENOTFOUND') ||
        candidate.code?.includes('EHOSTUNREACH') ||
        candidate.message?.includes('ECONNREFUSED') ||
        candidate.message?.includes('network')
    );
}

/**
 * Get appropriate HTTP status code for error
 */
export function getErrorStatusCode(error: unknown): number {
    if (!error || typeof error !== 'object') return 500;
    const candidate = error as any;

    // Check for explicit statusCode
    if (typeof candidate.statusCode === 'number') {
        return candidate.statusCode;
    }

    // Check for explicit status
    if (typeof candidate.status === 'number') {
        return candidate.status;
    }

    // Infer from error type
    if (isDuplicateKeyError(error)) return 409;
    if (isValidationError(error)) return 400;
    if (isTimeoutError(error)) return 504;
    if (isNetworkError(error)) return 503;

    return 500;
}
