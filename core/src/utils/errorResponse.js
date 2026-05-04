"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorResponse = exports.buildErrorResponse = void 0;
exports.sendCatalogError = sendCatalogError;
const apiResponse_1 = require("./apiResponse");
const buildErrorResponse = (req, status, error, options = {}) => {
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
exports.buildErrorResponse = buildErrorResponse;
const sendErrorResponse = (req, res, status, error, options = {}) => {
    return apiResponse_1.ApiResponse.sendError(req, res, status, error, options);
};
exports.sendErrorResponse = sendErrorResponse;
/**
 * Unified error handler for catalog operations
 */
function sendCatalogError(req, res, error, statusCodeOrOptions) {
    let statusCode = 500;
    let fallbackMessage;
    let isAdminView = req.originalUrl?.includes('/admin') ?? false;
    if (typeof statusCodeOrOptions === 'number') {
        statusCode = statusCodeOrOptions;
    }
    else if (typeof statusCodeOrOptions === 'object' && statusCodeOrOptions !== null) {
        statusCode = statusCodeOrOptions.statusCode ?? 500;
        fallbackMessage = statusCodeOrOptions.fallbackMessage;
        isAdminView = statusCodeOrOptions.isAdminView ?? isAdminView;
    }
    if (isDuplicateKeyError(error)) {
        return (0, exports.sendErrorResponse)(req, res, 400, 'Resource already exists', { isDuplicate: true });
    }
    if (isZodError(error)) {
        return (0, exports.sendErrorResponse)(req, res, 400, 'Validation failed', { issues: normalizeZodIssues(error) });
    }
    if (isMongoError(error)) {
        return (0, exports.sendErrorResponse)(req, res, 400, 'Database operation failed', { mongoError: error.message });
    }
    const message = typeof error === 'string'
        ? (fallbackMessage || error)
        : (fallbackMessage || (isAdminView ? `Catalog operation failed: ${error?.message || 'Unknown'}` : 'Not found'));
    return (0, exports.sendErrorResponse)(req, res, statusCode, message);
}
function isDuplicateKeyError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return candidate.code === 11000 || (typeof candidate.message === 'string' && candidate.message.includes('E11000'));
}
function isZodError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const issues = error.issues;
    return Array.isArray(issues);
}
function isMongoError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return candidate.name === 'MongoError' || candidate.name === 'MongoServerError';
}
function normalizeZodIssues(error) {
    return error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}
//# sourceMappingURL=errorResponse.js.map