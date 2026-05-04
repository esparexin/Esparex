"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = isError;
exports.isMongoError = isMongoError;
exports.isZodError = isZodError;
exports.isValidationError = isValidationError;
exports.extractErrorDetails = extractErrorDetails;
exports.contextualizeError = contextualizeError;
exports.getNormalizedErrorMessage = getNormalizedErrorMessage;
exports.isDuplicateKeyError = isDuplicateKeyError;
exports.isTimeoutError = isTimeoutError;
exports.isNetworkError = isNetworkError;
exports.getErrorStatusCode = getErrorStatusCode;
/**
 * Type guard: Check if value is an Error instance
 */
function isError(error) {
    return error instanceof Error;
}
/**
 * Type guard: Check for MongoDB error
 */
function isMongoError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return (error instanceof Error ||
        candidate.name === 'MongoError' ||
        candidate.name === 'MongoServerError' ||
        candidate.code === 11000 ||
        (typeof candidate.message === 'string' && candidate.message.includes('E11000')));
}
/**
 * Type guard: Check for Zod validation error
 */
function isZodError(error) {
    if (!error || typeof error !== 'object')
        return false;
    return 'issues' in error && Array.isArray(error.issues);
}
/**
 * Type guard: Check for validation error from various validators
 */
function isValidationError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return ((error instanceof Error && error.name === 'ValidationError') ||
        (error instanceof Error && error.name === 'ZodError') ||
        Boolean(candidate.issues) ||
        Boolean(candidate.validationErrors));
}
/**
 * Extract standard error details from any error type
 * Returns normalized error information suitable for logging
 */
function extractErrorDetails(error) {
    if (isError(error)) {
        const err = error;
        return {
            message: err.message,
            stack: err.stack,
            code: err.code,
            details: err.details
        };
    }
    if (typeof error === 'string') {
        return { message: error };
    }
    if (typeof error === 'object' && error !== null) {
        const candidate = error;
        return {
            message: typeof candidate.message === 'string' ? candidate.message : JSON.stringify(error),
            code: candidate.code,
            details: error
        };
    }
    return { message: String(error) };
}
/**
 * Add context to an error before rethrowing
 * Preserves original error while adding layer-specific context
 */
function contextualizeError(error, context) {
    const details = extractErrorDetails(error);
    const contextError = isError(error) ? error : new Error(details.message);
    contextError.message = `${context}: ${details.message}`;
    return contextError;
}
/**
 * Get normalized error message suitable for user-facing responses
 */
function getNormalizedErrorMessage(error, fallback = 'An unexpected error occurred') {
    if (isError(error)) {
        return error.message || fallback;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (typeof error === 'object' && error !== null) {
        const candidate = error;
        return typeof candidate.message === 'string' ? candidate.message : fallback;
    }
    return fallback;
}
/**
 * Check if error is a duplicate key error (E11000)
 */
function isDuplicateKeyError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return (candidate.code === 11000 ||
        (typeof candidate.message === 'string' && candidate.message.includes('E11000')));
}
/**
 * Check if error is a timeout error
 */
function isTimeoutError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return (candidate.message?.includes('timeout') === true ||
        candidate.message?.includes('TIMEOUT') === true ||
        candidate.code === 'ETIMEDOUT' ||
        candidate.code === 'EHOSTUNREACH');
}
/**
 * Check if error is a network/connectivity error
 */
function isNetworkError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return (candidate.code?.includes('ECONNREFUSED') === true ||
        candidate.code?.includes('ENOTFOUND') === true ||
        candidate.code?.includes('EHOSTUNREACH') === true ||
        candidate.message?.includes('ECONNREFUSED') === true ||
        candidate.message?.includes('network') === true);
}
/**
 * Get appropriate HTTP status code for error
 */
function getErrorStatusCode(error) {
    if (!error || typeof error !== 'object')
        return 500;
    const candidate = error;
    // Check for explicit statusCode
    if (typeof candidate.statusCode === 'number') {
        return candidate.statusCode;
    }
    // Check for explicit status
    if (typeof candidate.status === 'number') {
        return candidate.status;
    }
    // Infer from error type
    if (isDuplicateKeyError(error))
        return 409;
    if (isValidationError(error))
        return 400;
    if (isTimeoutError(error))
        return 504;
    if (isNetworkError(error))
        return 503;
    return 500;
}
//# sourceMappingURL=errorHelpers.js.map