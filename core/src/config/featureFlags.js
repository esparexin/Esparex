"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFlagOverride = exports.isEnabled = exports.FeatureFlag = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const redisCache_1 = require("@core/utils/redisCache");
var FeatureFlag;
(function (FeatureFlag) {
    FeatureFlag["ENABLE_AD_ORCHESTRATOR"] = "ENABLE_AD_ORCHESTRATOR";
    FeatureFlag["ENABLE_SPAREPARTS_SNAPSHOT"] = "ENABLE_SPAREPARTS_SNAPSHOT";
    FeatureFlag["ENABLE_FAILSAFE_FRAUD"] = "ENABLE_FAILSAFE_FRAUD";
    FeatureFlag["ENABLE_LIGHTWEIGHT_LISTING"] = "ENABLE_LIGHTWEIGHT_LISTING";
    FeatureFlag["ENABLE_AD_LISTINGTYPE_NULL_COMPAT"] = "ENABLE_AD_LISTINGTYPE_NULL_COMPAT";
})(FeatureFlag || (exports.FeatureFlag = FeatureFlag = {}));
const DEFAULT_FLAGS = {
    [FeatureFlag.ENABLE_AD_ORCHESTRATOR]: true,
    [FeatureFlag.ENABLE_SPAREPARTS_SNAPSHOT]: false,
    [FeatureFlag.ENABLE_FAILSAFE_FRAUD]: true,
    [FeatureFlag.ENABLE_LIGHTWEIGHT_LISTING]: false,
    [FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT]: true,
};
/**
 * Get feature flag value with hierarchy: Env -> Cache -> Default.
 * Feature flags are intentionally not backed by SystemConfig.
 */
const isEnabled = async (flag) => {
    // 1. Check Environment Variable first (Hard Override)
    const envVal = process.env[flag];
    if (envVal !== undefined) {
        return envVal === 'true';
    }
    // 2. Check Redis Cache
    const cacheKey = `ff:${flag}`;
    try {
        const cached = await (0, redisCache_1.getCache)(cacheKey);
        if (cached !== null && cached !== undefined) {
            return cached;
        }
    }
    catch (err) {
        logger_1.default.warn(`Feature flag cache read failed for ${flag}`, { error: err });
    }
    // 3. Fallback to hardcoded defaults
    return DEFAULT_FLAGS[flag];
};
exports.isEnabled = isEnabled;
/**
 * Kill-switch: Force set a flag in cache.
 */
const setFlagOverride = async (flag, value, ttlSeconds = 3600) => {
    const cacheKey = `ff:${flag}`;
    await (0, redisCache_1.setCache)(cacheKey, value, ttlSeconds);
    logger_1.default.info(`Feature flag override set: ${flag} = ${value}`);
};
exports.setFlagOverride = setFlagOverride;
//# sourceMappingURL=featureFlags.js.map