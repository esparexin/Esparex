import { jobRunner } from '@core/utils/jobRunner';
import logger from '@core/utils/logger';
import { runWithDistributedJobLock } from '@core/utils/distributedJobLock';
import UserPlan from '@core/models/UserPlan';

export const runExpireUserPlansJob = async () => {
    await runWithDistributedJobLock(
        'expire_user_plans',
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('ExpireUserPlans', async () => {
                logger.info('Running Expire User Plans Job');

                const now = new Date();
                const result = await UserPlan.updateMany(
                    {
                        status: 'active',
                        endDate: { $lte: now }
                    },
                    {
                        $set: { status: 'expired' }
                    }
                );

                logger.info('Expire User Plans Job completed', {
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
