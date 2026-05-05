import { warmHomeFeedCache } from '../services/FeedService';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import logger from '../utils/logger';

export const runHomeFeedWarmupJob = async () => {
    await runWithDistributedJobLock(
        'home_feed_warmup',
        { ttlMs: 45 * 1000, failOpen: false },
        async () => {
            try {
                await warmHomeFeedCache();
            } catch (error: unknown) {
                logger.error('Home feed warmup job failed', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    );
};
