"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCacheService = void 0;
const redisCache_1 = require("@core/utils/redisCache");
const logger_1 = __importDefault(require("@core/utils/logger"));
class AdminCacheService {
    /**
     * Get global cache health and metrics
     */
    static async getStats() {
        return (0, redisCache_1.getCacheStats)();
    }
    /**
     * Invalidate cache keys matching a specific pattern
     */
    static async invalidatePattern(pattern) {
        if (!pattern)
            throw new Error('Pattern is required for cache invalidation');
        // 🔒 SAFETY: Prepend namespace if not present to prevent accidental total flush
        // If the pattern is purely '*', reject it as too dangerous for a standard admin tool
        if (pattern === '*' || pattern === '') {
            throw new Error('Total cache flush is restricted to system-level maintenance');
        }
        const deleted = await (0, redisCache_1.clearCachePattern)(pattern);
        logger_1.default.info(`[AdminCache] Manual cache invalidation triggered`, {
            pattern,
            deletedCount: deleted
        });
        return { deleted };
    }
}
exports.AdminCacheService = AdminCacheService;
//# sourceMappingURL=AdminCacheService.js.map