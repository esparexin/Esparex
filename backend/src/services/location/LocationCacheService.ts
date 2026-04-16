import { getCache, setCache, delCache, CACHE_NAMESPACES, CACHE_TTLS } from '../../utils/redisCache';
import logger from '../../utils/logger';

const LOCATION_DOC_PREFIX = `${CACHE_NAMESPACES.LOCATION}:doc`;

export class LocationCacheService {
    /**
     * Get a location document from Redis
     */
    static async get(id: string): Promise<any | null> {
        return getCache(`${LOCATION_DOC_PREFIX}:${id}`);
    }

    /**
     * Set a location document in Redis
     */
    static async set(id: string, data: any): Promise<void> {
        try {
            await setCache(`${LOCATION_DOC_PREFIX}:${id}`, data, CACHE_TTLS.CITY_SEARCH * 24); // 24 Hours
        } catch (err) {
            logger.error(`Failed to cache location ${id}`, err);
        }
    }

    /**
     * Invalidate a location document from Redis
     */
    static async invalidate(id: string): Promise<void> {
        try {
            await delCache(`${LOCATION_DOC_PREFIX}:${id}`);
        } catch (err) {
            logger.error(`Failed to invalidate location cache ${id}`, err);
        }
    }

    /**
     * Batch set location documents (e.g. during imports)
     */
    static async batchSet(entries: { id: string, data: any }[]): Promise<void> {
        try {
            const promises = entries.map(e => this.set(e.id, e.data));
            await Promise.all(promises);
        } catch (err) {
            logger.error('Failed to batch cache locations', err);
        }
    }
}
