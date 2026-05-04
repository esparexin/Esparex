"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExpireUserPlansJob = void 0;
const jobRunner_1 = require("@core/utils/jobRunner");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const UserPlan_1 = __importDefault(require("@core/models/UserPlan"));
const runExpireUserPlansJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('expire_user_plans', { ttlMs: 30 * 60 * 1000, failOpen: false }, async () => {
        await (0, jobRunner_1.jobRunner)('ExpireUserPlans', async () => {
            logger_1.default.info('Running Expire User Plans Job');
            const now = new Date();
            const result = await UserPlan_1.default.updateMany({
                status: 'active',
                endDate: { $lte: now }
            }, {
                $set: { status: 'expired' }
            });
            logger_1.default.info('Expire User Plans Job completed', {
                expiredCount: result.modifiedCount,
                runAt: now.toISOString()
            });
            return {
                expiredCount: result.modifiedCount,
                runAt: now
            };
        });
    });
};
exports.runExpireUserPlansJob = runExpireUserPlansJob;
//# sourceMappingURL=expireUserPlans.job.js.map