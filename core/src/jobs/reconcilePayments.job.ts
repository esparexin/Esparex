// backend/src/jobs/reconcilePayments.job.ts
import { reconcilePayments } from './reconcilePayments';
import { jobRunner } from '../utils/jobRunner';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';

export const runPaymentReconciliationJob = async () => {
    await runWithDistributedJobLock(
        'payment_reconciliation',
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('PaymentReconciliation', async () => {
                await reconcilePayments();
                return { status: 'completed' };
            });
        }
    );
};
