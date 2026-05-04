"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExpireAdsJob = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const AdStatusService_1 = require("@core/services/AdStatusService");
const ListingExpiryService_1 = require("@core/services/ListingExpiryService");
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const runExpireAdsJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('expire_ads_job', { ttlMs: 30 * 60 * 1000, failOpen: false }, async () => {
        const now = new Date();
        try {
            logger_1.default.info('Expire Ads Job started', { timestamp: now.toISOString() });
            const [expiryResult, expiredBoostsCount] = await Promise.all([
                ListingExpiryService_1.ListingExpiryService.runSweep(now),
                (0, AdStatusService_1.expireBoosts)()
            ]);
            logger_1.default.info('Expire Ads Job completed', {
                expiredCount: expiryResult.expiredCount,
                touchedCount: expiryResult.touchedCount,
                expiredBoostsCount
            });
        }
        catch (error) {
            logger_1.default.error('Expire Ads Job failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
};
exports.runExpireAdsJob = runExpireAdsJob;
//# sourceMappingURL=expireAds.job.js.map