"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMonthlySlotResetJob = void 0;
const jobRunner_1 = require("@core/utils/jobRunner");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const PlanService_1 = require("@core/services/PlanService");
const runMonthlySlotResetJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('monthly_slot_reset', { ttlMs: 2 * 60 * 60 * 1000, failOpen: false }, async () => {
        await (0, jobRunner_1.jobRunner)('MonthlySlotReset', async () => {
            logger_1.default.info('Running Monthly Slot Reset Job');
            const now = new Date();
            const result = await (0, PlanService_1.resetWalletsForNewCycle)(now);
            logger_1.default.info('Monthly Slot Reset completed', {
                walletsUpdated: result.modifiedCount,
                resetDate: now.toISOString()
            });
            return {
                walletsUpdated: result.modifiedCount,
                resetDate: now
            };
        });
    });
};
exports.runMonthlySlotResetJob = runMonthlySlotResetJob;
//# sourceMappingURL=resetMonthlySlots.job.js.map