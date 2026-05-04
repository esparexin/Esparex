"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeApiKey = exports.createApiKey = exports.getApiKeys = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
const requestParams_1 = require("@esparex/core/utils/requestParams");
const ApiKeyService_1 = require("@esparex/core/services/ApiKeyService");
const getApiKeys = async (req, res) => {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const query = {};
        if (status && status !== 'all')
            query.status = status;
        const { items, total } = await (0, ApiKeyService_1.getApiKeys)(query, skip, limit);
        (0, adminBaseController_1.sendPaginatedResponse)(res, items, total, page, limit);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getApiKeys = getApiKeys;
const createApiKey = async (req, res) => {
    try {
        const keyBody = req.body;
        const name = typeof keyBody.name === 'string' ? keyBody.name.trim() : '';
        const scopes = Array.isArray(keyBody.scopes)
            ? keyBody.scopes.filter((scope) => typeof scope === 'string')
            : [];
        const expiresAt = keyBody.expiresAt ? new Date(keyBody.expiresAt) : undefined;
        if (!name) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'API key name is required', 400);
        }
        const createdBy = req.user?._id;
        if (!createdBy || !mongoose_1.default.Types.ObjectId.isValid(String(createdBy))) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Unauthorized', 401);
        }
        const { apiKey, rawKey } = await (0, ApiKeyService_1.createApiKey)({
            name,
            scopes,
            expiresAt,
            createdBy: new mongoose_1.default.Types.ObjectId(String(createdBy)),
        });
        await (0, adminLogger_1.logAdminAction)(req, 'CREATE_API_KEY', 'ApiKey', apiKey._id.toString(), {
            name,
            scopes,
            expiresAt,
        });
        (0, adminBaseController_1.sendSuccessResponse)(res, { ...apiKey.toJSON(), key: rawKey }, 'API key created successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createApiKey = createApiKey;
const revokeApiKey = async (req, res) => {
    try {
        const id = (0, requestParams_1.getSingleParam)(req, res, 'id', { error: 'Invalid API key ID' });
        if (!id)
            return;
        const apiKey = await (0, ApiKeyService_1.revokeApiKey)(id);
        if (!apiKey) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'API key not found', 404);
        }
        await (0, adminLogger_1.logAdminAction)(req, 'REVOKE_API_KEY', 'ApiKey', id, { keyPrefix: apiKey.keyPrefix });
        (0, adminBaseController_1.sendSuccessResponse)(res, apiKey, 'API key revoked successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.revokeApiKey = revokeApiKey;
//# sourceMappingURL=adminApiKeyController.js.map