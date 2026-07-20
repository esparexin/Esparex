import mongoose, { Types } from 'mongoose';
import type { NotificationTypeValue } from '@esparex/contracts';
import SavedSearch from '../models/SavedSearch';
import { getListingRepository } from '../composition/listings';
import { notificationMatchQueue } from '../queues/adQueue';
import { releaseQueueIdempotencySlot, reserveQueueIdempotencySlot } from '../queues/queueIdempotency';
import { withQueueDefaults } from '../queues/queueDefaults';
import logger from '../utils/logger';
import { toObjectId } from '../utils/idUtils';
import { addJobWithTrace } from '../utils/queueWrapper';
import { isQueueConnectionAvailable } from '../queues/redisConnection';
import { emitReliabilityAlert } from '../utils/reliabilityAlerts';
import { reliabilityAlertsTotal } from '../utils/metrics';
import { pLimit } from '../utils/pLimit';
import { NotificationIntent } from '../domain/NotificationIntent';
import { NotificationDispatcher } from './notification/NotificationDispatcher';
import { getNotificationTemplate } from './notification/NotificationTemplateService';
import { 
    SavedSearchMatchService, 
    type MinimalAdRecord, 
    type SavedSearchRecord 
} from './savedSearch/SavedSearchMatchService';
import { SavedSearchRateService } from './savedSearch/SavedSearchRateService';

import type { SavedSearchCreatePayload } from "@esparex/contracts";

const toSavedSearchContract = (search: SavedSearchRecord & { id?: string; userId: Types.ObjectId; createdAt?: Date }) => ({
    id: search._id?.toString() || search.id || '',
    userId: search.userId.toString(),
    query: search.query || '',
    categoryId: search.categoryId?.toString(),
    locationId: search.locationId?.toString(),
    priceMin: search.priceMin,
    priceMax: search.priceMax,
    createdAt: search.createdAt ? new Date(search.createdAt).toISOString() : undefined
});

export const createSavedSearch = async (
    userId: string,
    payload: SavedSearchCreatePayload
) => {
    const record = await SavedSearch.create({
        userId: new Types.ObjectId(userId),
        query: payload.query?.trim() || '',
        categoryId: toObjectId(payload.categoryId) || undefined,
        locationId: toObjectId(payload.locationId) || undefined,
        priceMin: typeof payload.priceMin === 'number' ? payload.priceMin : undefined,
        priceMax: typeof payload.priceMax === 'number' ? payload.priceMax : undefined
    });

    return toSavedSearchContract(record.toObject());
};

export const getSavedSearches = async (userId: string) => {
    const searches = await SavedSearch.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean<(SavedSearchRecord & { id?: string; userId: Types.ObjectId; createdAt?: Date })[]>();

    return searches.map((search) => toSavedSearchContract(search));
};

export const deleteSavedSearch = async (userId: string, id: string): Promise<boolean> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const removed = await SavedSearch.findOneAndDelete({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId)
    });
    return Boolean(removed);
};

export const enqueueSavedSearchAlertDispatch = async (adId: string): Promise<void> => {
    if (!isQueueConnectionAvailable()) {
        logger.warn('Saved-search alert dispatch enqueue skipped: queue unavailable', { adId });
        reliabilityAlertsTotal.labels('QUEUE_PAUSED_REDIS_UNAVAILABLE', 'high').inc();
        void emitReliabilityAlert({
            type: 'QUEUE_PAUSED_REDIS_UNAVAILABLE',
            title: 'Queue paused due to Redis outage',
            severity: 'high',
            summary: 'notification.match.queue is unavailable for saved-search dispatch',
            dedupeKey: 'queue_paused_saved_search_dispatch',
            metadata: {
                queueName: 'notification.match.queue',
                adId,
            },
        });
        return;
    }

    const jobId = `saved-search-alert:${adId}`;
    const reserved = await reserveQueueIdempotencySlot('notification.match.queue', jobId, 6 * 60 * 60);
    if (!reserved) {
        logger.debug('Saved-search alert dispatch enqueue skipped (idempotent duplicate)', { adId, jobId });
        return;
    }

    try {
        await addJobWithTrace(
            notificationMatchQueue,
            'alertDispatchJob',
            { adId },
            withQueueDefaults({
                jobId,
                backoff: { type: 'exponential', delay: 5_000 },
                removeOnComplete: 500,
                removeOnFail: 1_000,
            })
        );
    } catch (error) {
        await releaseQueueIdempotencySlot('notification.match.queue', jobId);
        throw error;
    }
};

export const processSavedSearchAlertDispatch = async (adId: string): Promise<void> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        logger.warn('Skipping saved-search alert dispatch: invalid adId', { adId });
        return;
    }

    const listing = await getListingRepository().findById(adId);
    if (!listing || listing.status !== 'live' || listing.isDeleted) {
        return;
    }

    const ad: MinimalAdRecord = {
        _id: new Types.ObjectId(listing.id),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        status: listing.status,
        seoSlug: listing.seoSlug,
        categoryId: listing.categoryId ? new Types.ObjectId(listing.categoryId) : undefined,
        location: {
            locationId: listing.location.locationId ? new Types.ObjectId(listing.location.locationId) : undefined,
            city: listing.location.city,
            display: listing.location.display,
            coordinates: {
                type: 'Point',
                coordinates: listing.location.coordinates,
            },
        },
    };

    const candidateFilter = SavedSearchMatchService.buildSearchFilter(ad);
    const candidates = await SavedSearch.find(candidateFilter)
        .select('_id userId query categoryId locationId priceMin priceMax createdAt')
        .lean<(SavedSearchRecord & { userId: Types.ObjectId })[]>();

    if (candidates.length === 0) return;

    const userMatchCounts = new Map<string, number>();
    for (const search of candidates) {
        if (!SavedSearchMatchService.matches(search, ad)) continue;

        const userId = search.userId.toString();
        userMatchCounts.set(userId, (userMatchCounts.get(userId) || 0) + 1);
    }

    if (userMatchCounts.size === 0) return;

    const adIdText = ad._id.toString();
    const link = ad.seoSlug ? `/ads/${ad.seoSlug}-${adIdText}` : `/ads/${adIdText}`;
    const locationDisplay = ad.location?.display || ad.location?.city || 'your selected area';

    const { title, body } = getNotificationTemplate('SMART_ALERT', {
        adTitle: ad.title,
        price: String(ad.price),
        location: locationDisplay,
    });

    const rateLimit = pLimit(10);
    const entries = Array.from(userMatchCounts.entries());

    const eligible = await Promise.all(entries.map(([userId, matchCount]) =>
        rateLimit(async () => {
            try {
                if (!await SavedSearchRateService.canDispatch(userId)) return null;
                if (!await SavedSearchRateService.reserve(userId, adIdText)) return null;
                return { userId, matchCount };
            } catch (error: unknown) {
                logger.error('Failed to check alert rate limit', {
                    userId,
                    adId: adIdText,
                    error: error instanceof Error ? error.message : String(error)
                });
                return null;
            }
        })
    ));

    const intents = eligible
        .filter((u): u is { userId: string; matchCount: number } => u !== null)
        .map(({ userId, matchCount }) =>
            new NotificationIntent({
                userId,
                type: 'SMART_ALERT' as NotificationTypeValue,
                entityRef: { domain: 'system', id: userId },
                message: {
                    title,
                    body,
                    data: { adId: adIdText, link, matchedSavedSearches: String(matchCount) },
                },
                channels: ['in-app', 'push'],
                priority: 'medium',
            })
        );

    if (intents.length > 0) {
        await NotificationDispatcher.bulkDispatch(intents);
    }

    logger.info('Saved-search alert dispatch completed', {
        adId: adIdText,
        matchedUsers: userMatchCounts.size
    });
};
