import { CACHE_NAMESPACES } from './constants';
import { clearCachePattern } from './scan';
import { delCache } from './operations';

export const invalidateAdFeedCaches = async (): Promise<void> => {
    await Promise.all([
        clearCachePattern('home_feed:*'),
        clearCachePattern('spotlight:*'),
        clearCachePattern('feed:*:home:*'),
        clearCachePattern(`${CACHE_NAMESPACES.ADS_HOME}:*`),
        clearCachePattern(`${CACHE_NAMESPACES.SEARCH}:*`)
    ]);
};

export const invalidatePublicAdCache = async (adId: string | { toString(): string }): Promise<void> => {
    const normalizedId = String(adId ?? '').trim();
    if (!normalizedId) return;
    await delCache(`ad:public:${normalizedId}`);
};

export const invalidateLocationCaches = async (): Promise<void> => {
    await clearCachePattern('location:search:city:*');
};
