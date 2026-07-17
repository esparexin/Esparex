import SmartAlert from '../models/SmartAlert';
import { getListingRepository } from '../composition/listings';
import AlertDeliveryLog from '../models/AlertDeliveryLog';
import { Types } from 'mongoose';
import logger from '../utils/logger';
import { buildGeoNearStage } from '../utils/mongoGeoUtils';
import { dispatchTemplatedNotification } from './NotificationService';
import type { AdminLogFn } from './AdminListingsService';
import { AppError } from '../utils/AppError';

import { getCache, setCache } from '../utils/redisCache';
import crypto from 'crypto';
import { toObjectId } from '../utils/idUtils';

interface MatchableAlert {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    name: string;
    notificationChannels?: string[];
    distanceFromAd?: number;
    criteria?: Record<string, unknown>;
}

type AdMatchCriteria = {
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    locationId?: unknown;
    /** Parent location ObjectId strings up the hierarchy (state, country) */
    locationParentIds?: string[];
    price?: unknown;
    keywords?: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
};



const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
};

const buildSmartAlertQuery = (criteria: AdMatchCriteria): Record<string, unknown> => {
    const and: Record<string, unknown>[] = [{ isActive: true }];

    const categoryId = toObjectId(criteria.categoryId);
    if (categoryId) {
        and.push({
            $or: [
                { 'criteria.categoryId': { $exists: false } },
                { 'criteria.categoryId': null },
                { 'criteria.categoryId': categoryId }
            ]
        });
    }

    const brandId = toObjectId(criteria.brandId);
    if (brandId) {
        and.push({
            $or: [
                { 'criteria.brandId': { $exists: false } },
                { 'criteria.brandId': null },
                { 'criteria.brandId': brandId }
            ]
        });
    }

    const modelId = toObjectId(criteria.modelId);
    if (modelId) {
        and.push({
            $or: [
                { 'criteria.modelId': { $exists: false } },
                { 'criteria.modelId': null },
                { 'criteria.modelId': modelId }
            ]
        });
    }

    const locationId = toObjectId(criteria.locationId);
    // PR 8 — Smart Alert path-match: include parent-level locationIds so that
    // a state-level alert fires for city-level ads (e.g. alert for Maharashtra
    // triggers on a Mumbai ad because Mumbai's locationPath includes Maharashtra).
    const parentLocationIds: Types.ObjectId[] = (criteria.locationParentIds ?? [])
        .map((id: string) => toObjectId(id))
        .filter((id): id is Types.ObjectId => id !== undefined);

    const locationCandidates = [
        ...(locationId ? [locationId] : []),
        ...parentLocationIds,
    ];

    if (locationCandidates.length > 0) {
        and.push({
            $or: [
                { 'criteria.locationId': { $exists: false } },
                { 'criteria.locationId': null },
                { 'criteria.locationId': { $in: locationCandidates } }
            ]
        });
    }

    const price =
        toFiniteNumber(criteria.price) ??
        toFiniteNumber(criteria.maxPrice) ??
        toFiniteNumber(criteria.minPrice);
    if (typeof price === 'number') {
        and.push({
            $or: [
                { 'criteria.minPrice': { $exists: false } },
                { 'criteria.minPrice': null },
                { 'criteria.minPrice': { $lte: price } }
            ]
        });
        and.push({
            $or: [
                { 'criteria.maxPrice': { $exists: false } },
                { 'criteria.maxPrice': null },
                { 'criteria.maxPrice': { $gte: price } }
            ]
        });
    }

    if (and.length === 1) {
        return and[0] || { isActive: true };
    }
    return { $and: and };
};

const matchesAlertKeywords = (alertKeywords: unknown, adText: unknown): boolean => {
    if (typeof alertKeywords !== 'string' || alertKeywords.trim().length === 0) return true;
    if (typeof adText !== 'string' || adText.trim().length === 0) return false;

    const text = adText.toLowerCase();
    const tokens = alertKeywords
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);

    if (tokens.length === 0) return true;
    return tokens.every((token) => text.includes(token));
};

/**
 * Find Smart Alerts that match the area of a newly created Ad.
 *
 * Logic:
 * 1. Alerts store { coordinates: [lng, lat], radiusKm: N }
 * 2. Ad location is [adLng, adLat]
 * 3. Match: Distance(Alert, Ad) <= Alert.radiusKm
 *
 * Results are cached per (lat, lng, criteria) for 60 seconds to prevent
 * repeated $geoNear aggregations on sequential ad activations.
 */
export const findMatchingGeoAlerts = async (
    adCoords: [number, number],
    criteria: Record<string, unknown>
) => {
    if (!adCoords || adCoords.length !== 2) return [];

    const [adLng, adLat] = adCoords;

    // Deterministic cache key from coords + criteria
    const criteriaHash = crypto
        .createHash('sha1')
        .update(JSON.stringify(criteria))
        .digest('hex')
        .substring(0, 12);
    const cacheKey = `smartAlerts:${adLat.toFixed(4)}:${adLng.toFixed(4)}:${criteriaHash}`;

    const cached = await getCache<MatchableAlert[]>(cacheKey);
    if (cached) {
        logger.debug('Smart alert cache hit', { cacheKey });
        return cached;
    }

    // SSOT: SmartAlert has its own schema keys under `criteria.*`.
    const geoQuery = buildSmartAlertQuery(criteria || {});

    // Use aggregation to find nearest alerts and filter by their specific radius
    const matchingAlerts = await SmartAlert.aggregate<MatchableAlert>([
        buildGeoNearStage({
            lng: adLng,
            lat: adLat,
            key: 'coordinates',
            radiusKm: 500, // Hard limit 500km to optimize index usage
            distanceField: 'distanceFromAd',
            query: geoQuery
        }),
        {
            // Filter: distance <= radiusKm * 1000
            $match: {
                $expr: {
                    $lte: ['$distanceFromAd', { $multiply: ['$radiusKm', 1000] }]
                }
            }
        },
        {
            $project: {
                userId: 1,
                name: 1,
                notificationChannels: 1,
                distanceFromAd: 1,
                criteria: 1
            }
        }
    ]);

    const filteredByKeywords = matchingAlerts.filter((alert) =>
        matchesAlertKeywords(alert.criteria?.keywords, criteria?.keywords)
    );

    await setCache(cacheKey, filteredByKeywords, 60);
    return filteredByKeywords;
};


export const processAdForAlerts = async (adId: string | Types.ObjectId) => {
    try {
        const ad = await getListingRepository().findById(adId.toString());

        if (!ad) {
            logger.warn(`[AlertMatch] Could not process alerts: Ad ${String(adId)} not found`);
            return;
        }

        if (!ad.location || !ad.location.coordinates || ad.location.coordinates.length !== 2) {
            logger.error('REGRESSION: Ad missing valid coordinates for smart alerts matching', {
                adId: ad.id,
                status: ad.status,
                hasLocation: !!ad.location,
                hasCoords: !!ad.location?.coordinates
            });
            return;
        }

        const adCoords: [number, number] = [ad.location.coordinates[0], ad.location.coordinates[1]]; // [lng, lat]

        // Pass full ad as criteria to find exact matches + parent-path matches
        const locationParentIds: string[] = Array.isArray(ad.locationPath)
            ? ad.locationPath.map((id: unknown) => String(id))
            : [];

        const matches = await findMatchingGeoAlerts(adCoords, {
            categoryId: ad.categoryId?.toString(),
            brandId: ad.brandId?.toString(),
            modelId: ad.modelId?.toString(),
            locationId: ad.location.locationId?.toString(),
            locationParentIds,
            price: ad.price,
            minPrice: ad.price,
            maxPrice: ad.price,
            keywords: ad.title
        });

        if (matches.length > 0) {
            logger.info('[AlertMatch] Found matching smart alerts for new ad', { count: matches.length, adId: ad.id });

            // --- DUPLICATE GUARD: Filter out already delivered alerts ---
            const matchIds = matches.map(m => m._id);
            const alreadyDelivered = await AlertDeliveryLog.find({
                adId: ad.id,
                alertId: { $in: matchIds }
            } as Record<string, unknown>).distinct('alertId');


            const filteredMatches = matches.filter(m => !alreadyDelivered.some(id => id.toString() === m._id.toString()));

            if (filteredMatches.length === 0) {
                logger.debug('[AlertMatch] All matching alerts already delivered for this ad via idempotency guard', { adId: ad.id });
                return;
            }

            // --- BATCH PROCESSING: Prevent event loop blocking ---
            const BATCH_SIZE = 100;
            for (let i = 0; i < filteredMatches.length; i += BATCH_SIZE) {
                const batch = filteredMatches.slice(i, i + BATCH_SIZE);

                // Extract loop arrays to decouple background execution out of the active batch window.
                const { NotificationIntent } = await import('../domains/identity');
                const { NotificationDispatcher } = await import('./notification/NotificationDispatcher');

                const intents = batch.map(match => {
                    const channels = Array.isArray(match.notificationChannels) && match.notificationChannels.length > 0
                        ? match.notificationChannels
                        : ['push', 'in-app']; 

                    return NotificationIntent.fromSmartAlert(
                        match.userId.toString(),
                        match.name,
                        ad.id,
                        match._id.toString(),
                        channels
                    );
                });

                // Note: shadowDispatch currently disabled to trigger FCM push logic actively for Phase-2 verification
                // To rollout silently, set { shadowDispatch: true }
                await NotificationDispatcher.bulkDispatch(intents, { shadowDispatch: false });

                logger.info('[AlertMatch] Processed batch of smart alert NotificationIntents via Dispatcher', {
                    count: batch.length,
                    totalRemaining: filteredMatches.length - (i + batch.length)
                });
            }
        }

    } catch (error) {
        logger.error('Error processing smart alerts', { error: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * Automatically deactivate Smart Alerts that have passed their expiresAt date.
 *
 * Performance: uses bulkWrite + insertMany instead of N×alert.save() + N×AdminLog.create()
 * to eliminate N+1 write patterns.
 */
export const expireSmartAlerts = async () => {
    const now = new Date();
    const expiring = await SmartAlert.find({
        isActive: true,
        expiresAt: { $lt: now }
    }).lean();

    if (!expiring.length) return [];

    // Batch update all expired alerts in a single bulkWrite
    const bulkOps = expiring.map(alert => ({
        updateOne: {
            filter: { _id: alert._id },
            update: {
                $set: {
                    isActive: false,
                    status: 'expired',
                    expiredAt: now,
                },
                $push: {
                    timeline: {
                        status: 'expired',
                        timestamp: now,
                        reason: 'Automated search alert expiry',
                    },
                },
            },
        },
    }));

    await SmartAlert.bulkWrite(bulkOps);

    // Single AdminLog.insertMany for the entire batch (was N×AdminLog.create)
    try {
        const AdminLog = (await import('../models/AdminLog')).default;
        await AdminLog.insertMany(
            expiring.map(alert => ({
                action: 'automated_expiry',
                targetType: 'SmartAlert',
                targetId: alert._id,
                metadata: {
                    userId: alert.userId,
                    expiresAt: alert.expiresAt,
                    reason: 'Automated search alert expiry',
                },
            }))
        );
    } catch (logErr) {
        // AdminLog write failure must not block the expiry job
        logger.error('[SmartAlertCleanup] Failed to write AdminLog batch', {
            error: logErr instanceof Error ? logErr.message : String(logErr),
            count: expiring.length,
        });
    }

    logger.info('[SmartAlertCleanup] Expired alerts batch complete', {
        count: expiring.length,
        alertIds: expiring.map(a => a._id),
    });

    return expiring;
};


export const getAlertDeliveryLogs = async (skip: number, limit: number) => {
    const [logs, total] = await Promise.all([
        AlertDeliveryLog.find({})
            .sort({ deliveredAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('alertId', 'name criteria user')
            .populate('adId', 'title price location status')
            .lean(),
        AlertDeliveryLog.countDocuments(),
    ]);
    return { logs, total };
};

// ── Typed model wrapper for controller shared files ───────────────────────────
export type SmartAlertDocument = {
    _id?: unknown;
    userId: { toString: () => string } | string;
    isActive: boolean;
    save: () => Promise<unknown>;
} & Record<string, unknown>;

export type SmartAlertQuery = Promise<SmartAlertDocument[]> & {
    sort: (sortBy: Record<string, 1 | -1>) => SmartAlertQuery;
    skip: (n: number) => SmartAlertQuery;
    limit: (n: number) => SmartAlertQuery;
};

export const SmartAlertModel = SmartAlert as unknown as {
    countDocuments: (query: Record<string, unknown>) => Promise<number>;
    create: (payload: Record<string, unknown>) => Promise<SmartAlertDocument>;
    find: (query: Record<string, unknown>) => SmartAlertQuery;
    findById: (id: string) => Promise<SmartAlertDocument | null>;
    findByIdAndDelete: (id: string) => Promise<unknown>;
};

export const adminBulkResendAlertWarnings = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError('A non-empty list of alert IDs is required', 400);
    }

    // Batch-fetch all alerts in a single query (was N×SmartAlert.findById)
    const alerts = await SmartAlert.find({ _id: { $in: ids } }).lean();
    const alertMap = new Map(alerts.map(a => [String(a._id), a]));

    const now = new Date();
    const results = [];
    const bulkOps: Parameters<typeof SmartAlert.bulkWrite>[0] = [];

    for (const id of ids) {
        const alert = alertMap.get(id);
        try {
            if (!alert) throw new AppError('Alert not found', 404);

            await dispatchTemplatedNotification(
                alert.userId.toString(),
                'SYSTEM',
                'SMART_ALERT_EXPIRY_WARNING_3D',
                { 
                    name: (alert.name as string) || 'Saved Search', 
                    date: (alert.expiresAt as Date | undefined)?.toLocaleDateString() || 'N/A' 
                },
                { alertId: String(alert._id) }
            );

            // Queue the save op — will be executed in a single bulkWrite below
            bulkOps.push({
                updateOne: {
                    filter: { _id: alert._id },
                    update: {
                        $set: {
                            expiryWarningSentAt: now,
                            expiryWarningCount: ((alert.expiryWarningCount as number) || 0) + 1,
                            lastExpiryWarningChannel: 'in-app',
                        },
                    },
                },
            });

            await logFn('expiry_warning_resent', 'SmartAlert', id, {
                subType: 'SmartAlert',
                adminId: actorId,
            });

            results.push({ id, success: true });
        } catch (error) {
            results.push({ 
                id, 
                success: false, 
                message: error instanceof Error ? error.message : String(error),
            });
        }
    }

    // Single bulkWrite for all successful saves (was N×alert.save())
    if (bulkOps.length > 0) {
        await SmartAlert.bulkWrite(bulkOps);
    }

    return {
        processedCount: ids.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
        results,
    };
};

export const deleteSmartAlert = async (id: string) => {
    return SmartAlert.findByIdAndDelete(id);
};
