import { jobRunner } from '../utils/jobRunner';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import { expireBusinesses } from '../services/business/BusinessLifecycleService';
import { cascadeExpireBusinessListings } from '../services/AdminBusinessService';
import { dispatchTemplatedNotification } from '../services/NotificationService';
import { ACTOR_TYPE } from '@esparex/contracts';
import { BUSINESS_STATUS } from '@esparex/contracts';

export const runExpireBusinessesJob = async () => {
    await runWithDistributedJobLock(
        'expire_businesses_job',
        { ttlMs: 60 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('ExpireBusinesses', async () => {
                logger.info('Running Automated Business Expiration Job');

                const expiredBusinesses = await expireBusinesses();

                if (expiredBusinesses.length > 0) {
                    logger.info(`Successfully expired ${expiredBusinesses.length} businesses.`);

                    const actor = { type: ACTOR_TYPE.SYSTEM, id: 'cron_expireBusinesses' };

                    for (const biz of expiredBusinesses) {
                        try {
                            // 1. Cascade expire their listings (which stops active promotions by changing status)
                            const cascadedCount = await cascadeExpireBusinessListings(
                                biz._id,
                                actor,
                                'Automatic expiration: Business subscription ended'
                            );
                            
                            logger.info('Cascaded expiry to listings', { businessId: biz._id, count: cascadedCount });

                            // 2. Dispatch notifications
                            await dispatchTemplatedNotification(
                                biz.userId.toString(),
                                'BUSINESS_STATUS',
                                'BUSINESS_EXPIRED',
                                { name: biz.name },
                                { businessId: biz._id.toString(), status: BUSINESS_STATUS.EXPIRED }
                            );
                        } catch (err) {
                            logger.error('Error handling secondary effects for expired business', {
                                businessId: biz._id,
                                error: err instanceof Error ? err.message : String(err)
                            });
                        }
                    }
                }

                return { expiredCount: expiredBusinesses.length };
            });
        }
    );
};
