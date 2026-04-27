"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHomeFeedWarmupJob = void 0;
const FeedService_1 = require("@core/services/FeedService");
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const logger_1 = __importDefault(require("@core/utils/logger"));
const runHomeFeedWarmupJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('home_feed_warmup', { ttlMs: 45 * 1000, failOpen: false }, async () => {
        try {
            await (0, FeedService_1.warmHomeFeedCache)();
        }
        catch (error) {
            logger_1.default.error('Home feed warmup job failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
};
exports.runHomeFeedWarmupJob = runHomeFeedWarmupJob;
//# sourceMappingURL=homeFeedWarmup.job.js.map