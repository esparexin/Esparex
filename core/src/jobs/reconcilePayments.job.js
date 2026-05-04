"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPaymentReconciliationJob = void 0;
// backend/src/jobs/reconcilePayments.job.ts
const reconcilePayments_1 = require("./reconcilePayments");
const jobRunner_1 = require("@core/utils/jobRunner");
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const runPaymentReconciliationJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('payment_reconciliation', { ttlMs: 30 * 60 * 1000, failOpen: false }, async () => {
        await (0, jobRunner_1.jobRunner)('PaymentReconciliation', async () => {
            await (0, reconcilePayments_1.reconcilePayments)();
            return { status: 'completed' };
        });
    });
};
exports.runPaymentReconciliationJob = runPaymentReconciliationJob;
//# sourceMappingURL=reconcilePayments.job.js.map