import { jobRunner } from '../utils/jobRunner';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import Entitlement from '../models/Entitlement';

/**
 * ⌛ EXPIRE ENTITLEMENTS JOB
 * Transitions active Entitlements to 'EXPIRED' status when their expiresAt date passes.
 */
export const runExpireEntitlementsJob = async () => {
    await runWithDistributedJobLock(
        'expire_entitlements',
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('ExpireEntitlements', async () => {
                logger.info('Running Expire Entitlements Job');

                const now = new Date();
                const result = await Entitlement.updateMany(
                    {
                        status: 'ACTIVE',
                        expiresAt: { $ne: null, $lte: now }
                    },
                    {
                        $set: { status: 'EXPIRED' }
                    }
                );

                logger.info('Expire Entitlements Job completed', {
                    expiredCount: result.modifiedCount,
                    runAt: now.toISOString()
                });

                return {
                    expiredCount: result.modifiedCount,
                    runAt: now
                };
            });
        }
    );
};
