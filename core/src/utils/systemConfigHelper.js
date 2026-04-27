"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateSystemConfigCache = exports.ensureSystemConfig = exports.getSystemConfigDoc = exports.SYSTEM_CONFIG_CACHE_KEY = exports.SYSTEM_CONFIG_KEY = void 0;
const SystemConfig_1 = __importDefault(require("@core/models/SystemConfig"));
const redis_1 = __importDefault(require("@core/config/redis"));
const logger_1 = __importDefault(require("./logger"));
exports.SYSTEM_CONFIG_KEY = 'global';
exports.SYSTEM_CONFIG_CACHE_KEY = `system:config:${exports.SYSTEM_CONFIG_KEY}`;
const CACHE_TTL = 60; // 60 seconds
// Explicitly type the model to avoid dynamic export typing issues
const ModelObj = SystemConfig_1.default;
const getSystemConfigDoc = async () => {
    try {
        // 1. Try Cache
        const cached = await redis_1.default.get(exports.SYSTEM_CONFIG_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
        // 2. Try DB
        const config = await ModelObj.findOne({ singletonKey: exports.SYSTEM_CONFIG_KEY }).lean();
        // 3. Store in Cache if exists
        if (config) {
            await redis_1.default.set(exports.SYSTEM_CONFIG_CACHE_KEY, JSON.stringify(config), 'EX', CACHE_TTL);
        }
        return config;
    }
    catch (error) {
        logger_1.default.error('[SystemConfigHelper] Cache error:', error);
        // Fallback to direct DB lookup on cache failure
        return ModelObj.findOne({ singletonKey: exports.SYSTEM_CONFIG_KEY }).lean();
    }
};
exports.getSystemConfigDoc = getSystemConfigDoc;
const ensureSystemConfig = async (defaults = {}) => {
    return ModelObj.findOneAndUpdate({ singletonKey: exports.SYSTEM_CONFIG_KEY }, { $setOnInsert: { singletonKey: exports.SYSTEM_CONFIG_KEY, ...defaults } }, { upsert: true, new: true, setDefaultsOnInsert: true });
};
exports.ensureSystemConfig = ensureSystemConfig;
const invalidateSystemConfigCache = async () => {
    try {
        await redis_1.default.del(exports.SYSTEM_CONFIG_CACHE_KEY);
    }
    catch (error) {
        logger_1.default.error('[SystemConfigHelper] Cache invalidate error:', error);
    }
};
exports.invalidateSystemConfigCache = invalidateSystemConfigCache;
//# sourceMappingURL=systemConfigHelper.js.map