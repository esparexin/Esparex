"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationCacheService = void 0;
const redisCache_1 = require("@core/utils/redisCache");
const logger_1 = __importDefault(require("@core/utils/logger"));
const LOCATION_DOC_PREFIX = `${redisCache_1.CACHE_NAMESPACES.LOCATION}:doc`;
class LocationCacheService {
    /**
     * Get a location document from Redis
     */
    static async get(id) {
        return (0, redisCache_1.getCache)(`${LOCATION_DOC_PREFIX}:${id}`);
    }
    /**
     * Set a location document in Redis
     */
    static async set(id, data) {
        try {
            await (0, redisCache_1.setCache)(`${LOCATION_DOC_PREFIX}:${id}`, data, redisCache_1.CACHE_TTLS.CITY_SEARCH * 24); // 24 Hours
        }
        catch (err) {
            logger_1.default.error(`Failed to cache location ${id}`, err);
        }
    }
    /**
     * Invalidate a location document from Redis
     */
    static async invalidate(id) {
        try {
            await (0, redisCache_1.delCache)(`${LOCATION_DOC_PREFIX}:${id}`);
        }
        catch (err) {
            logger_1.default.error(`Failed to invalidate location cache ${id}`, err);
        }
    }
    /**
     * Batch set location documents (e.g. during imports)
     */
    static async batchSet(entries) {
        try {
            const promises = entries.map(e => this.set(e.id, e.data));
            await Promise.all(promises);
        }
        catch (err) {
            logger_1.default.error('Failed to batch cache locations', err);
        }
    }
}
exports.LocationCacheService = LocationCacheService;
//# sourceMappingURL=LocationCacheService.js.map