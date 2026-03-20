import { redisConnection } from '../../queues/redisConnection';
import logger from '../../utils/logger';

export class NotificationVersionService {
    /**
     * Increments and returns the user's notification inbox version securely via Redis.
     * This acts as the SSOT vector for websocket frontend cache invalidation.
     */
    static async incrementVersion(userId: string): Promise<number> {
        try {
            const cacheKey = `inbox_version:${userId}`;
            // Atomic increment
            const newVersion = await redisConnection.incr(cacheKey);
            
            // Optional: Maintain TTL if users are highly inactive to save memory, 
            // but usually notification versions are considered persistent.
            // await redisConnection.expire(cacheKey, 60 * 60 * 24 * 30); // 30 days
            
            return newVersion;
        } catch (error: any) {
            logger.error(`[NotificationVersionService] Failed to increment inbox_version for user ${userId}`, { error: error.message });
            // Fallback: If Redis fails, frontend gracefully falls back to polling or assumes version +1
            return Date.now();
        }
    }

    /**
     * Reads the current version safely without incrementing.
     */
    static async getVersion(userId: string): Promise<number> {
        try {
            const val = await redisConnection.get(`inbox_version:${userId}`);
            return val ? parseInt(val, 10) : 0;
        } catch (error) {
            return 0;
        }
    }
}
