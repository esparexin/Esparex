"use strict";
/**
 * Shared utilities for catalog controllers
 * Extracted from original catalog.content.controller.ts
 *
 * Validation logic is delegated to CatalogValidationService (SSOT).
 * Re-exports keep existing controller imports stable.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDuplicateKeyError = exports.sendEmptyPublicList = exports.sendValidationError = exports.asModel = exports.getAdminActorId = exports.hasAdminAccess = exports.handlePaginatedContent = exports.validateActiveCategories = exports.getActiveCategoryIds = exports.ACTIVE_BRAND_QUERY = exports.ACTIVE_CATEGORY_QUERY = exports.CATALOG_STATUS = exports.sendCatalogError = exports.sendSuccessResponse = exports.sendAdminError = void 0;
exports.handleCatalogCreate = handleCatalogCreate;
exports.handleCatalogUpdate = handleCatalogUpdate;
exports.handleCatalogToggleStatus = handleCatalogToggleStatus;
exports.handleCatalogDelete = handleCatalogDelete;
exports.handleCatalogReview = handleCatalogReview;
const slugify_1 = __importDefault(require("slugify"));
const nanoid_1 = require("nanoid");
const respond_1 = require("@core/utils/respond");
Object.defineProperty(exports, "sendSuccessResponse", { enumerable: true, get: function () { return respond_1.sendSuccessResponse; } });
const errorResponse_1 = require("@core/utils/errorResponse");
Object.defineProperty(exports, "sendCatalogError", { enumerable: true, get: function () { return errorResponse_1.sendCatalogError; } });
const adminBaseController_1 = require("@core/utils/adminBaseController");
Object.defineProperty(exports, "sendAdminError", { enumerable: true, get: function () { return adminBaseController_1.sendAdminError; } });
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
Object.defineProperty(exports, "CATALOG_STATUS", { enumerable: true, get: function () { return catalogStatus_1.CATALOG_STATUS; } });
// Re-export SSOT validation helpers so controllers import from one place.
const CatalogValidationService_1 = require("@core/services/catalog/CatalogValidationService");
Object.defineProperty(exports, "ACTIVE_CATEGORY_QUERY", { enumerable: true, get: function () { return CatalogValidationService_1.ACTIVE_CATEGORY_QUERY; } });
Object.defineProperty(exports, "ACTIVE_BRAND_QUERY", { enumerable: true, get: function () { return CatalogValidationService_1.ACTIVE_BRAND_QUERY; } });
Object.defineProperty(exports, "getActiveCategoryIds", { enumerable: true, get: function () { return CatalogValidationService_1.getActiveCategoryIds; } });
Object.defineProperty(exports, "validateActiveCategories", { enumerable: true, get: function () { return CatalogValidationService_1.validateActiveCategories; } });
const adminLogger_1 = require("@core/utils/adminLogger");
const contentHandler_1 = require("@core/utils/contentHandler");
Object.defineProperty(exports, "handlePaginatedContent", { enumerable: true, get: function () { return contentHandler_1.handlePaginatedContent; } });
/**
 * Check if request has admin access
 */
const hasAdminAccess = (req) => {
    const catalogRequest = req;
    const role = catalogRequest.user?.role;
    return role === 'admin' || role === 'super_admin';
};
exports.hasAdminAccess = hasAdminAccess;
/**
 * Extract admin actor ID from request context
 */
const getAdminActorId = (req) => {
    const catalogRequest = req;
    const userId = catalogRequest.user?._id ?? catalogRequest.user?.id;
    if (typeof userId === 'string')
        return userId;
    if (userId && typeof userId.toString === 'function')
        return userId.toString();
    const adminEntry = catalogRequest.admin;
    const adminId = adminEntry?._id ?? adminEntry?.id;
    if (typeof adminId === 'string')
        return adminId;
    if (adminId && typeof adminId.toString === 'function')
        return adminId.toString();
    return undefined;
};
exports.getAdminActorId = getAdminActorId;
/**
 * Type-safe model wrapper
 */
const asModel = (model) => model;
exports.asModel = asModel;
// sendCatalogError is imported and re-exported from "@core/utils/errorResponse" (line above)
/**
 * Send Zod validation error response mapping issues to field-level details
 */
const sendValidationError = (req, res, error) => {
    (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Validation failed', {
        details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
        }))
    });
};
exports.sendValidationError = sendValidationError;
/**
 * Send an empty paginated list response (common for invalid public filters)
 */
const sendEmptyPublicList = (res) => {
    res.status(200).json((0, respond_1.respond)({
        success: true,
        data: {
            items: [],
            total: 0
        }
    }));
};
exports.sendEmptyPublicList = sendEmptyPublicList;
/**
 * Check if a mongo error is a duplicate key error
 */
const isDuplicateKeyError = (error) => {
    if (!error || typeof error !== 'object')
        return false;
    const candidate = error;
    return candidate.code === 11000 || (typeof candidate.message === 'string' && candidate.message.includes('E11000'));
};
exports.isDuplicateKeyError = isDuplicateKeyError;
/* ======================================================
   GENERIC CATALOG CRUD HANDLERS
====================================================== */
/**
 * GENERIC CREATE
 */
async function handleCatalogCreate(req, res, model, schema, options = {}) {
    try {
        if (!(0, exports.hasAdminAccess)(req)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Admin access required');
        }
        let payload = req.body;
        if (options.preOp) {
            payload = await options.preOp(payload);
        }
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return (0, exports.sendValidationError)(req, res, parsed.error);
        }
        const data = parsed.data;
        if (options.slugifyName && data.name) {
            data.slug = (0, slugify_1.default)(data.name, { lower: true, strict: true }) + '-' + (0, nanoid_1.nanoid)(6);
        }
        const item = await model.create(data);
        if (options.postOp)
            options.postOp();
        if (options.auditAction) {
            void (0, adminLogger_1.logAdminAction)(req, options.auditAction, model.modelName, item._id, { data });
        }
        return (0, respond_1.sendSuccessResponse)(res, item, `${model.modelName} created successfully`);
    }
    catch (error) {
        if ((0, exports.isDuplicateKeyError)(error)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 400, `${model.modelName} already exists`);
        }
        return (0, errorResponse_1.sendCatalogError)(req, res, error);
    }
}
/**
 * GENERIC UPDATE
 */
async function handleCatalogUpdate(req, res, model, schema, options = {}) {
    try {
        if (!(0, exports.hasAdminAccess)(req)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Admin access required');
        }
        const id = String(req.params.id);
        const existing = await model.findById(id);
        if (!existing) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 404, `${model.modelName} not found`);
        }
        let payload = req.body;
        if (options.preUpdate) {
            payload = await options.preUpdate(id, payload, existing);
        }
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            return (0, exports.sendValidationError)(req, res, parsed.error);
        }
        const data = parsed.data;
        if (options.slugifyName && data.name) {
            data.slug = (0, slugify_1.default)(data.name, { lower: true, strict: true });
        }
        const item = await model.findByIdAndUpdate(id, data, { new: true });
        if (options.postOp)
            options.postOp();
        if (options.auditAction) {
            void (0, adminLogger_1.logAdminAction)(req, options.auditAction, model.modelName, item._id, { updates: data });
        }
        return (0, respond_1.sendSuccessResponse)(res, item, `${model.modelName} updated successfully`);
    }
    catch (error) {
        if ((0, exports.isDuplicateKeyError)(error)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 400, `${model.modelName} already exists`);
        }
        return (0, errorResponse_1.sendCatalogError)(req, res, error);
    }
}
/**
 * GENERIC TOGGLE STATUS
 */
async function handleCatalogToggleStatus(req, res, model, options = {}) {
    try {
        if (!(0, exports.hasAdminAccess)(req)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Admin access required');
        }
        const item = await model.findById(req.params.id);
        if (!item) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 404, `${model.modelName} not found`);
        }
        const isActive = !item.isActive;
        const status = isActive ? catalogStatus_1.CATALOG_STATUS.ACTIVE : catalogStatus_1.CATALOG_STATUS.INACTIVE;
        const nextState = model.schema.path('status')
            ? { isActive, status }
            : { isActive };
        await model.findByIdAndUpdate(req.params.id, nextState);
        if (options.postOp)
            options.postOp();
        if (options.auditAction) {
            void (0, adminLogger_1.logAdminAction)(req, options.auditAction, model.modelName, item._id, { isActive, status });
        }
        return (0, respond_1.sendSuccessResponse)(res, nextState, `${model.modelName} status updated to ${status}`);
    }
    catch (error) {
        return (0, errorResponse_1.sendCatalogError)(req, res, error);
    }
}
/**
 * GENERIC DELETE
 */
async function handleCatalogDelete(req, res, model, checkDependencies, options = {}) {
    try {
        if (!(0, exports.hasAdminAccess)(req)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Admin access required');
        }
        const id = String(req.params.id);
        if (checkDependencies) {
            const deps = await checkDependencies(id);
            if (deps.count > 0) {
                return (0, errorResponse_1.sendErrorResponse)(req, res, 400, `Cannot delete ${model.modelName} with active dependencies`, { details: deps.details });
            }
        }
        const softDeleteUpdate = model.schema.path('status')
            ? { isDeleted: true, status: catalogStatus_1.CATALOG_STATUS.INACTIVE }
            : { isDeleted: true };
        const item = await model.findByIdAndUpdate(id, softDeleteUpdate, { new: true });
        if (!item) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 404, `${model.modelName} not found`);
        }
        if (options.postOp)
            options.postOp();
        if (options.auditAction) {
            void (0, adminLogger_1.logAdminAction)(req, options.auditAction, model.modelName, item._id);
        }
        return (0, respond_1.sendSuccessResponse)(res, null, `${model.modelName} deleted successfully`);
    }
    catch (error) {
        return (0, errorResponse_1.sendCatalogError)(req, res, error);
    }
}
/**
 * GENERIC REVIEW (APPROVE/REJECT)
 */
async function handleCatalogReview(req, res, model, action, schema, options = {}) {
    try {
        if (!(0, exports.hasAdminAccess)(req)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 403, 'Admin access required');
        }
        let updates = {};
        if (action === 'APPROVE') {
            updates = { status: catalogStatus_1.CATALOG_STATUS.ACTIVE, isActive: true };
        }
        else {
            const parsed = schema?.safeParse(req.body);
            if (schema && !parsed?.success) {
                return (0, exports.sendValidationError)(req, res, parsed.error);
            }
            updates = {
                status: catalogStatus_1.CATALOG_STATUS.REJECTED,
                isActive: false,
                rejectionReason: parsed?.data?.reason || req.body?.reason
            };
        }
        const item = await model.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!item) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 404, `${model.modelName} not found`);
        }
        if (options.postOp)
            options.postOp();
        if (options.auditAction) {
            void (0, adminLogger_1.logAdminAction)(req, options.auditAction, model.modelName, item._id, { updates });
        }
        return (0, respond_1.sendSuccessResponse)(res, item, `${model.modelName} ${action.toLowerCase()}d successfully`);
    }
    catch (error) {
        return (0, errorResponse_1.sendCatalogError)(req, res, error);
    }
}
//# sourceMappingURL=shared.js.map