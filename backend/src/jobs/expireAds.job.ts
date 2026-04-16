import logger from "../utils/logger";
import { expireBoosts } from "../services/adStatusService";
import { ListingExpiryService } from "../services/ListingExpiryService";
import { runWithDistributedJobLock } from "../utils/distributedJobLock";

export const runExpireAdsJob = async () => {
    await runWithDistributedJobLock(
        'expire_ads_job',
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            const now = new Date();
            try {
                logger.info('Expire Ads Job started', { timestamp: now.toISOString() });
                const [expiryResult, expiredBoostsCount] = await Promise.all([
                    ListingExpiryService.runSweep(now),
                    expireBoosts()
                ]);

                logger.info('Expire Ads Job completed', {
                    expiredCount: expiryResult.expiredCount,
                    touchedCount: expiryResult.touchedCount,
                    expiredBoostsCount
                });
            } catch (error) {
                logger.error('Expire Ads Job failed', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    );
};
