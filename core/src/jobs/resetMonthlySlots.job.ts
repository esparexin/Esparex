import { jobRunner } from '../utils/jobRunner';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import { resetWalletsForNewCycle } from '../services/PlanService';

export const runMonthlySlotResetJob = async () => {
    await runWithDistributedJobLock(
        'monthly_slot_reset',
        { ttlMs: 2 * 60 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('MonthlySlotReset', async () => {
                logger.info('Running Monthly Slot Reset Job');

                const now = new Date();
                const result = await resetWalletsForNewCycle(now);

                logger.info('Monthly Slot Reset completed', {
                    walletsUpdated: result.modifiedCount,
                    resetDate: now.toISOString()
                });

                return {
                    walletsUpdated: result.modifiedCount,
                    resetDate: now
                };
            });
        }
    );
};
