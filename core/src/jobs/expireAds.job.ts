import logger from "../utils/logger";
import { expireBoosts } from "../domains/listings/application/lifecycle/AdStatusService";
import { ListingExpiryService } from "../domains/listings/application/lifecycle/ListingExpiryService";
import { runWithDistributedJobLock } from "../utils/distributedJobLock";

export const runExpireAdsJob = async () => {
    await runWithDistributedJobLock(
        'expire_ads_job',
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            const now = new Date();
            try {
                logger.info('Expire Ads Job started', { timestamp: now.toISOString() });
                const [expiryResult, expiredBoostsCount, expiredSpotlightsCount] = await Promise.all([
                    ListingExpiryService.runSweep(now),
                    expireBoosts(),
                    ListingExpiryService.sweepExpiredSpotlights(now)
                ]);

                logger.info('Expire Ads Job completed', {
                    expiredCount: expiryResult.expiredCount,
                    touchedCount: expiryResult.touchedCount,
                    expiredBoostsCount,
                    expiredSpotlightsCount
                });
            } catch (error) {
                logger.error('Expire Ads Job failed', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    );
};
