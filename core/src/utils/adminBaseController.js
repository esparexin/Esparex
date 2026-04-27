"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminError = exports.sendSuccessResponse = exports.sendPaginatedResponse = exports.getPaginationParams = exports.checkPermission = exports.respond = void 0;
var respond_1 = require("./respond");
Object.defineProperty(exports, "respond", { enumerable: true, get: function () { return respond_1.respond; } });
const apiResponse_1 = require("./apiResponse");
const logger_1 = __importDefault(require("@core/utils/logger"));
/**
 * 🔐 ESPAREX PERMISSION CHECKER
 * Ensures the admin user has the required scope for the action.
 * Supports wildcard (*) for full access.
 */
const checkPermission = (user, module, action) => {
    if (!user)
        return false;
    if (user.role === 'super_admin')
        return true;
    if (user.permissions?.includes('*') || user.permissions?.includes('all'))
        return true;
    // Check specific permission
    // Format expected: "module:action" or just "module"
    // But previously it expected nested map. 
    // The middleware uses: permissions.includes(permission)
    // So we should expect 'module:action' string to be passed.
    // If exact match
    if (user.permissions?.includes(action))
        return true; // Assuming action is full permission string like 'users:write'
    // If module wildcard
    if (user.permissions?.includes(`${module}:*`))
        return true;
    return false;
};
exports.checkPermission = checkPermission;
const getPaginationParams = (req) => {
    const rawPage = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    let page = parseInt(String(rawPage)) || 1;
    let limit = parseInt(String(rawLimit)) || 10;
    if (page < 1)
        page = 1;
    if (limit > 100)
        limit = 100;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPaginationParams = getPaginationParams;
var respond_2 = require("./respond");
Object.defineProperty(exports, "sendPaginatedResponse", { enumerable: true, get: function () { return respond_2.sendPaginatedResponse; } });
Object.defineProperty(exports, "sendSuccessResponse", { enumerable: true, get: function () { return respond_2.sendSuccessResponse; } });
/**
 * 🛠️ CENTRALIZED ADMIN ERROR HANDLER
 * Standardizes administrative error responses.
 */
const sendAdminError = (req, res, error, statusCode = 500) => {
    const isError = error instanceof Error;
    const message = isError ? error.message : String(error);
    const code = error.code;
    const details = error.details;
    if (statusCode >= 500) {
        logger_1.default.error('ADMIN_CONTROLLER_ERROR', {
            path: req.path,
            method: req.method,
            error: message,
            stack: isError ? error.stack : undefined
        });
    }
    const errorPayload = { code };
    if (details !== undefined)
        errorPayload.details = details;
    return apiResponse_1.ApiResponse.sendError(req, res, statusCode, message, errorPayload);
};
exports.sendAdminError = sendAdminError;
//# sourceMappingURL=adminBaseController.js.map