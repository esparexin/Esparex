"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const serialize_1 = require("@core/utils/serialize");
const trace_1 = require("@shared/observability/trace");
class ApiResponse {
    /**
     * Standard success response
     */
    static sendSuccess(res, data, message, statusCode = 200) {
        const req = res.req;
        const payload = {
            success: true,
            data: (0, serialize_1.serializeDoc)(data),
            error: null,
            meta: {
                requestId: trace_1.TraceContext.getCorrelationId(),
                timestamp: new Date().toISOString(),
                path: req.originalUrl || req.path || 'unknown'
            }
        };
        if (message) {
            payload.message = message;
        }
        return res.status(statusCode).json(payload);
    }
    /**
     * Standard error response
     */
    static sendError(req, res, status, error, options = {}) {
        const payload = {
            success: false,
            data: null,
            error,
            meta: {
                requestId: trace_1.TraceContext.getCorrelationId(),
                timestamp: new Date().toISOString(),
                path: req.originalUrl || req.path || 'unknown'
            }
        };
        // Merge extra options (code, details, etc.) into top level or meta as needed
        const fullPayload = {
            ...payload,
            ...options,
            status // Consistent with legacy errorResponse
        };
        return res.status(status).json(fullPayload);
    }
    /**
     * Standard paginated response
     */
    static sendPaginated(res, items, total, page, limit) {
        const req = res.req;
        const payload = {
            success: true,
            data: {
                items: (0, serialize_1.serializeDoc)(items)
            },
            error: null,
            meta: {
                requestId: trace_1.TraceContext.getCorrelationId(),
                timestamp: new Date().toISOString(),
                path: req.originalUrl || req.path || 'unknown',
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        };
        return res.status(200).json(payload);
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=apiResponse.js.map