import Ad from "../models/Ad";
import User from "../models/User";
import Location from "../models/Location";
import LocationAnalytics from "../models/LocationAnalytics";
import { AD_STATUS } from '../../../shared/enums/adStatus';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';

export const runLocationAnalyticsJob = async () => {
    await runWithDistributedJobLock(
        'location_analytics_refresh',
        { ttlMs: 2 * 60 * 60 * 1000, failOpen: false },
        async () => {
            logger.info('Starting Location Analytics Worker...');
            try {
                await updateLocationStats();
                logger.info('Location Analytics Worker completed successfully.');
            } catch (error) {
                logger.error('Location Analytics Worker failed', { error });
            }
        }
    );
};

/**
 * Refreshes LocationAnalytics for all active locations.
 * Computes adsCount, activeAdsCount, usersCount, searchCount, viewCount,
 * popularityScore, and isHotZone in a single consolidated write.
 *
 * Previously also wrote to LocationStats (now removed — merged here).
 */
export const updateLocationStats = async (triggeredBy: 'cron' | 'manual' = 'cron') => {
    logger.info('Updating location analytics...', { triggeredBy });

    let jobLog;
    try {
        const JobLogStart = (await import('../models/JobLog')).default;
        jobLog = await JobLogStart.create({
            jobName: 'refreshLocationStats',
            status: 'started',
            triggeredBy,
            startedAt: new Date()
        });
    } catch (e) {
        logger.error('Failed to create start JobLog', { error: e });
    }

    const startTime = Date.now();

    try {
        // Only need _id — city/state were only required for the removed LocationStats writes
        const locations = await Location.find({ isActive: true }).select('_id').lean();
        const locationIds = locations.map((loc) => loc._id);

        const [adCountsAgg, userCountsAgg, existingAnalyticsDocs] = await Promise.all([
            Ad.aggregate<{
                _id: unknown;
                adsCount: number;
                activeAdsCount: number;
            }>([
                { $match: { 'location.locationId': { $in: locationIds } } },
                {
                    $group: {
                        _id: '$location.locationId',
                        adsCount: { $sum: 1 },
                        activeAdsCount: {
                            $sum: { $cond: [{ $eq: ['$status', AD_STATUS.LIVE] }, 1, 0] }
                        }
                    }
                }
            ]),
            User.aggregate<{
                _id: unknown;
                usersCount: number;
            }>([
                { $match: { locationId: { $in: locationIds } } },
                {
                    $group: {
                        _id: '$locationId',
                        usersCount: { $sum: 1 }
                    }
                }
            ]),
            LocationAnalytics.find({ locationId: { $in: locationIds } })
                .select('locationId searchCount viewCount')
                .lean()
        ]);

        const adCountByLocationId = new Map<string, { adsCount: number; activeAdsCount: number }>();
        const userCountByLocationId = new Map<string, number>();
        const analyticsByLocationId = new Map<string, { searchCount: number; viewCount: number }>();

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
                searchCount: Number((item as { searchCount?: number }).searchCount || 0),
                viewCount: Number((item as { viewCount?: number }).viewCount || 0)
            });
        }

        const analyticsBulkOps: Parameters<typeof LocationAnalytics.bulkWrite>[0] = [];

        for (const loc of locations) {
            const locationKey = String(loc._id);
            const adCounts = adCountByLocationId.get(locationKey);
            const adsCount = adCounts?.adsCount ?? 0;
            const activeAdsCount = adCounts?.activeAdsCount ?? 0;
            const usersCount = userCountByLocationId.get(locationKey) ?? 0;
            const existingAnalytics = analyticsByLocationId.get(locationKey);
            const searchCount = existingAnalytics?.searchCount ?? 0;
            const viewCount = existingAnalytics?.viewCount ?? 0;

            const popularityScore = Number(
                (adsCount * 0.4 + searchCount * 0.3 + viewCount * 0.3).toFixed(2)
            );
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
            const result = await LocationAnalytics.bulkWrite(analyticsBulkOps);
            updateCount = result.modifiedCount + result.upsertedCount;
            logger.info(`Updated analytics for ${analyticsBulkOps.length} locations.`, { updateCount });
        } else {
            logger.info('No location analytics to update.');
        }

        if (jobLog) {
            jobLog.status = 'success';
            jobLog.completedAt = new Date();
            jobLog.durationMs = Date.now() - startTime;
            jobLog.result = { processedLocations: locations.length, updatedAnalytics: updateCount };
            await jobLog.save();
        }

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error updating location analytics:', { error: err });

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
