"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationVersionService = void 0;
const redisConnection_1 = require("@core/queues/redisConnection");
const logger_1 = __importDefault(require("@core/utils/logger"));
class NotificationVersionService {
    /**
     * Increments and returns the user's notification inbox version securely via Redis.
     * This acts as the SSOT vector for websocket frontend cache invalidation.
     */
    static async incrementVersion(userId) {
        try {
            const cacheKey = `inbox_version:${userId}`;
            // Atomic increment
            const newVersion = await redisConnection_1.redisConnection.incr(cacheKey);
            // Maintain TTL (30 days) to prevent memory leaks from stale/deleted user IDs.
            await redisConnection_1.redisConnection.expire(cacheKey, 60 * 60 * 24 * 30);
            return newVersion;
        }
        catch (error) {
            logger_1.default.error(`[NotificationVersionService] Failed to increment inbox_version for user ${userId}`, { error: error.message });
            // Fallback: If Redis fails, frontend gracefully falls back to polling or assumes version +1
            return Date.now();
        }
    }
    /**
     * Reads the current version safely without incrementing.
     */
    static async getVersion(userId) {
        try {
            const val = await redisConnection_1.redisConnection.get(`inbox_version:${userId}`);
            return val ? parseInt(val, 10) : 0;
        }
        catch {
            return 0;
        }
    }
}
exports.NotificationVersionService = NotificationVersionService;
//# sourceMappingURL=NotificationVersionService.js.map