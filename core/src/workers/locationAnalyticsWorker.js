"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLocationStats = exports.runLocationAnalyticsJob = void 0;
const Ad_1 = __importDefault(require("@core/models/Ad"));
const User_1 = __importDefault(require("@core/models/User"));
const Location_1 = __importDefault(require("@core/models/Location"));
const LocationAnalytics_1 = __importDefault(require("@core/models/LocationAnalytics"));
const adStatus_1 = require("@core/constants/enums/adStatus");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const runLocationAnalyticsJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('location_analytics_refresh', { ttlMs: 2 * 60 * 60 * 1000, failOpen: false }, async () => {
        logger_1.default.info('Starting Location Analytics Worker...');
        try {
            await (0, exports.updateLocationStats)();
            logger_1.default.info('Location Analytics Worker completed successfully.');
        }
        catch (error) {
            logger_1.default.error('Location Analytics Worker failed', { error });
        }
    });
};
exports.runLocationAnalyticsJob = runLocationAnalyticsJob;
/**
 * Refreshes LocationAnalytics for all active locations.
 * Computes adsCount, activeAdsCount, usersCount, searchCount, viewCount,
 * popularityScore, and isHotZone in a single consolidated write.
 *
 * Previously also wrote to LocationStats (now removed — merged here).
 */
const updateLocationStats = async (triggeredBy = 'cron') => {
    logger_1.default.info('Updating location analytics...', { triggeredBy });
    let jobLog;
    try {
        const JobLogStart = (await Promise.resolve().then(() => __importStar(require('@core/models/JobLog')))).default;
        jobLog = await JobLogStart.create({
            jobName: 'refreshLocationStats',
            status: 'started',
            triggeredBy,
            startedAt: new Date()
        });
    }
    catch (e) {
        logger_1.default.error('Failed to create start JobLog', { error: e });
    }
    const startTime = Date.now();
    try {
        // Only need _id — city/state were only required for the removed LocationStats writes
        const locations = await Location_1.default.find({ isActive: true }).select('_id').lean();
        const locationIds = locations.map((loc) => loc._id);
        const [adCountsAgg, userCountsAgg, existingAnalyticsDocs] = await Promise.all([
            Ad_1.default.aggregate([
                { $match: { 'location.locationId': { $in: locationIds } } },
                {
                    $group: {
                        _id: '$location.locationId',
                        adsCount: { $sum: 1 },
                        activeAdsCount: {
                            $sum: { $cond: [{ $eq: ['$status', adStatus_1.AD_STATUS.LIVE] }, 1, 0] }
                        }
                    }
                }
            ]),
            User_1.default.aggregate([
                { $match: { locationId: { $in: locationIds } } },
                {
                    $group: {
                        _id: '$locationId',
                        usersCount: { $sum: 1 }
                    }
                }
            ]),
            LocationAnalytics_1.default.find({ locationId: { $in: locationIds } })
                .select('locationId searchCount viewCount')
                .lean()
        ]);
        const adCountByLocationId = new Map();
        const userCountByLocationId = new Map();
        const analyticsByLocationId = new Map();
        for (const item of adCountsAgg) {
            adCountByLocationId.set(String(item._id), {
                adsCount: Number(item.adsCount || 0),
                activeAdsCount: Number(item.activeAdsCount || 0)
            });
        }
        for (const item of userCountsAgg) {
            userCountByLocationId.set(String(item._id), Number(item.usersCount || 0));
        }
        for (const item of existingAnalyticsDocs) {
            analyticsByLocationId.set(String(item.locationId), {
                searchCount: Number(item.searchCount || 0),
                viewCount: Number(item.viewCount || 0)
            });
        }
        const analyticsBulkOps = [];
        for (const loc of locations) {
            const locationKey = String(loc._id);
            const adCounts = adCountByLocationId.get(locationKey);
            const adsCount = adCounts?.adsCount ?? 0;
            const activeAdsCount = adCounts?.activeAdsCount ?? 0;
            const usersCount = userCountByLocationId.get(locationKey) ?? 0;
            const existingAnalytics = analyticsByLocationId.get(locationKey);
            const searchCount = existingAnalytics?.searchCount ?? 0;
            const viewCount = existingAnalytics?.viewCount ?? 0;
            const popularityScore = Number((adsCount * 0.4 + searchCount * 0.3 + viewCount * 0.3).toFixed(2));
            const isHotZone = searchCount >= 100 || adsCount >= 50;
            analyticsBulkOps.push({
                updateOne: {
                    filter: { locationId: loc._id },
                    update: {
                        $set: {
                            locationId: loc._id,
                            adsCount,
                            activeAdsCount,
                            usersCount,
                            searchCount,
                            viewCount,
                            popularityScore,
                            isHotZone,
                            lastUpdated: new Date()
                        }
                    },
                    upsert: true
                }
            });
        }
        let updateCount = 0;
        if (analyticsBulkOps.length > 0) {
            const result = await LocationAnalytics_1.default.bulkWrite(analyticsBulkOps);
            updateCount = result.modifiedCount + result.upsertedCount;
            logger_1.default.info(`Updated analytics for ${analyticsBulkOps.length} locations.`, { updateCount });
        }
        else {
            logger_1.default.info('No location analytics to update.');
        }
        if (jobLog) {
            jobLog.status = 'success';
            jobLog.completedAt = new Date();
            jobLog.durationMs = Date.now() - startTime;
            jobLog.result = { processedLocations: locations.length, updatedAnalytics: updateCount };
            await jobLog.save();
        }
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger_1.default.error('Error updating location analytics:', { error: err });
        if (jobLog) {
            jobLog.status = 'failed';
            jobLog.completedAt = new Date();
            jobLog.durationMs = Date.now() - startTime;
            jobLog.error = errorMessage;
            await jobLog.save();
        }
        throw err;
    }
};
exports.updateLocationStats = updateLocationStats;
//# sourceMappingURL=locationAnalyticsWorker.js.map