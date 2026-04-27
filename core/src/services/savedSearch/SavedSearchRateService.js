"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchRateService = void 0;
const redis_1 = __importDefault(require("@core/config/redis"));
const MAX_ALERTS_PER_USER_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_ALERT_RATE_KEY_PREFIX = 'saved-search-alerts:rate';
const USER_AD_DEDUPE_KEY_PREFIX = 'saved-search-alerts:dedupe';
const USER_AD_DEDUPE_TTL_SECONDS = 24 * 60 * 60;
class SavedSearchRateService {
    /**
     * Checks if a user has exceeded their alert budget for the current hour
     */
    static async canDispatch(userId) {
        const hourBucket = new Date().toISOString().slice(0, 13);
        const rateLimitKey = `${USER_ALERT_RATE_KEY_PREFIX}:${userId}:${hourBucket}`;
        const current = await redis_1.default.incr(rateLimitKey);
        if (current === 1) {
            await redis_1.default.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
        }
        return current <= MAX_ALERTS_PER_USER_PER_HOUR;
    }
    /**
     * Ensures we don't alert the same user for the same ad multiple times
     */
    static async reserve(userId, adId) {
        const dedupeKey = `${USER_AD_DEDUPE_KEY_PREFIX}:${adId}:${userId}`;
        const reserved = await redis_1.default.set(dedupeKey, '1', 'EX', USER_AD_DEDUPE_TTL_SECONDS, 'NX');
        return reserved === 'OK';
    }
}
exports.SavedSearchRateService = SavedSearchRateService;
//# sourceMappingURL=SavedSearchRateService.js.map