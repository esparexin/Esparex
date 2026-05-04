import { getCacheStats, clearCachePattern } from '@esparex/core/utils/redisCache';
import logger from '@esparex/core/utils/logger';

export class AdminCacheService {
    /**
     * Get global cache health and metrics
     */
    static async getStats() {
        return getCacheStats();
    }

    /**
     * Invalidate cache keys matching a specific pattern
     */
    static async invalidatePattern(pattern: string): Promise<{ deleted: number }> {
        if (!pattern) throw new Error('Pattern is required for cache invalidation');
        
        // 🔒 SAFETY: Prepend namespace if not present to prevent accidental total flush
        // If the pattern is purely '*', reject it as too dangerous for a standard admin tool
        if (pattern === '*' || pattern === '') {
            throw new Error('Total cache flush is restricted to system-level maintenance');
        }

        const deleted = await clearCachePattern(pattern);
        
        logger.info(`[AdminCache] Manual cache invalidation triggered`, {
            pattern,
            deletedCount: deleted
        });

        return { deleted };
    }
}
