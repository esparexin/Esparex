"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginatedResponse = exports.sendSuccessResponse = void 0;
exports.respond = respond;
const serialize_1 = require("@core/utils/serialize");
const apiResponse_1 = require("./apiResponse");
/**
 * Enforces explicit type checking for API response payloads
 * and automatically normalizes Mongo _id to id.
 */
function respond(payload) {
    return (0, serialize_1.serializeDoc)(payload);
}
/**
 * Enhanced Success Response
 * Delegates to unified ApiResponse for consistent meta/envelope.
 */
const sendSuccessResponse = (res, data, message, statusCode = 200) => {
    return apiResponse_1.ApiResponse.sendSuccess(res, data, message, statusCode);
};
exports.sendSuccessResponse = sendSuccessResponse;
/**
 * Enhanced Paginated Response
 * Delegates to unified ApiResponse for consistent meta/pagination.
 */
const sendPaginatedResponse = (res, data, total, page, limit) => {
    return apiResponse_1.ApiResponse.sendPaginated(res, data, total, page, limit);
};
exports.sendPaginatedResponse = sendPaginatedResponse;
//# sourceMappingURL=respond.js.map