"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeApiKey = exports.createApiKey = exports.getApiKeys = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ApiKey_1 = __importDefault(require("@core/models/ApiKey"));
const apiKeyStatus_1 = require("@core/constants/enums/apiKeyStatus");
const hashApiKey = (rawKey) => crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
const getApiKeys = async (query, skip, limit) => {
    const [items, total] = await Promise.all([
        ApiKey_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'firstName lastName email'),
        ApiKey_1.default.countDocuments(query),
    ]);
    return { items, total };
};
exports.getApiKeys = getApiKeys;
const createApiKey = async (params) => {
    const rawKey = `esk_live_${crypto_1.default.randomBytes(24).toString('hex')}`;
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);
    const apiKey = await ApiKey_1.default.create({
        name: params.name,
        keyHash,
        keyPrefix,
        scopes: params.scopes,
        status: apiKeyStatus_1.API_KEY_STATUS.ACTIVE,
        createdBy: params.createdBy,
        expiresAt: params.expiresAt,
    });
    return { apiKey, rawKey };
};
exports.createApiKey = createApiKey;
const revokeApiKey = async (id) => {
    return ApiKey_1.default.findByIdAndUpdate(id, { status: apiKeyStatus_1.API_KEY_STATUS.REVOKED, revokedAt: new Date() }, { new: true });
};
exports.revokeApiKey = revokeApiKey;
//# sourceMappingURL=ApiKeyService.js.map