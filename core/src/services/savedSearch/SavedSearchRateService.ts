import redisClient from '../../config/redis';

const MAX_ALERTS_PER_USER_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_ALERT_RATE_KEY_PREFIX = 'saved-search-alerts:rate';
const USER_AD_DEDUPE_KEY_PREFIX = 'saved-search-alerts:dedupe';
const USER_AD_DEDUPE_TTL_SECONDS = 24 * 60 * 60;

export class SavedSearchRateService {
    /**
     * Checks if a user has exceeded their alert budget for the current hour
     */
    static async canDispatch(userId: string): Promise<boolean> {
        const hourBucket = new Date().toISOString().slice(0, 13);
        const rateLimitKey = `${USER_ALERT_RATE_KEY_PREFIX}:${userId}:${hourBucket}`;
        
        const current = await redisClient.incr(rateLimitKey);
        if (current === 1) {
            await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
        }
        return current <= MAX_ALERTS_PER_USER_PER_HOUR;
    }

    /**
     * Ensures we don't alert the same user for the same ad multiple times
     */
    static async reserve(userId: string, adId: string): Promise<boolean> {
        const dedupeKey = `${USER_AD_DEDUPE_KEY_PREFIX}:${adId}:${userId}`;
        const reserved = await redisClient.set(
            dedupeKey,
            '1',
            'EX',
            USER_AD_DEDUPE_TTL_SECONDS,
            'NX'
        );
        return reserved === 'OK';
    }
}
