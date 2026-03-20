// import { connectDB } from "../config/db";
import Ad from "../models/Ad";
import User from "../models/User";
import Location from "../models/Location";
import LocationStats from "../models/LocationStats";
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

export const updateLocationStats = async (triggeredBy: 'cron' | 'manual' = 'cron') => {
    logger.info('Updating location stats...', { triggeredBy });

    // Create JobLog entry
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
        // Ensure DB is connected (though should be by the time worker starts)
        // await connectDB(); 

        const locations = await Location.find({ isActive: true }).select('city state _id').lean();
        const locationIds = locations.map((location) => location._id);

        const bulkOps: Parameters<typeof LocationStats.bulkWrite>[0] = [];
        const analyticsBulkOps: Parameters<typeof LocationAnalytics.bulkWrite>[0] = [];

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
                            $sum: {
                                $cond: [{ $eq: ['$status', AD_STATUS.LIVE] }, 1, 0]
                            }
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

        for (const loc of locations) {
            const locationKey = String(loc._id);
            const adCounts = adCountByLocationId.get(locationKey);
            const adsCount = adCounts?.adsCount || 0;
            const activeAdsCount = adCounts?.activeAdsCount || 0;
            const usersCount = userCountByLocationId.get(locationKey) || 0;
            const existingAnalytics = analyticsByLocationId.get(locationKey);

            if (adsCount > 0 || usersCount > 0) {
                bulkOps.push({
                    updateOne: {
                        filter: { locationId: loc._id },
                        update: {
                            $set: {
                                locationId: loc._id,
                                city: loc.city,
                                state: loc.state,
                                adsCount,
                                activeAdsCount,
                                usersCount,
                                lastUpdated: new Date()
                            }
                        },
                        upsert: true
                    }
                });
            }

            const searchCount = Number(existingAnalytics?.searchCount || 0);
            const viewCount = Number(existingAnalytics?.viewCount || 0);
            const popularityScore = Number(
                (
                    adsCount * 0.4 +
                    searchCount * 0.3 +
                    viewCount * 0.3
                ).toFixed(2)
            );
            const isHotZone = searchCount >= 100 || adsCount >= 50;

            analyticsBulkOps.push({
                updateOne: {
                    filter: { locationId: loc._id },
                    update: {
                        $set: {
                            locationId: loc._id,
                            adsCount,
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
        if (bulkOps.length > 0) {
            const res = await LocationStats.bulkWrite(bulkOps);
            updateCount = res.modifiedCount + res.upsertedCount;
            logger.info(`Updated stats for ${bulkOps.length} locations.`, { updateCount });
        } else {
            logger.info('No location stats to update.');
        }

        if (analyticsBulkOps.length > 0) {
            await LocationAnalytics.bulkWrite(analyticsBulkOps);
            logger.info(`Updated analytics for ${analyticsBulkOps.length} locations.`);
        }

        // Update JobLog on success
        if (jobLog) {
            jobLog.status = 'success';
            jobLog.completedAt = new Date();
            jobLog.durationMs = Date.now() - startTime;
            jobLog.result = { processedLocations: locations.length, updatedStats: updateCount };
            await jobLog.save();
        }

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error updating location stats:', { error: err });

        // Update JobLog on failure
        if (jobLog) {
            jobLog.status = 'failed';
            jobLog.completedAt = new Date();
            jobLog.durationMs = Date.now() - startTime;
            jobLog.error = errorMessage;
            await jobLog.save();
        }
        throw err; // Re-throw to ensure caller knows about failure
    }
};
