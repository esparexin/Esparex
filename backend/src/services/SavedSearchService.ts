import mongoose, { Types } from 'mongoose';
import SavedSearch from '../models/SavedSearch';
import Ad from '../models/Ad';
import { notificationMatchQueue } from '../queues/adQueue';
import { dispatchTemplatedNotification } from './NotificationService';
import logger from '../utils/logger';
import { toObjectId } from '../utils/idUtils';
import { 
    SavedSearchMatchService, 
    type MinimalAdRecord, 
    type SavedSearchRecord 
} from './savedSearch/SavedSearchMatchService';
import { SavedSearchRateService } from './savedSearch/SavedSearchRateService';

import type { SavedSearchCreatePayload } from '../../../shared/schemas/savedSearch.schema';

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

    return toSavedSearchContract(record.toObject() as SavedSearchRecord & { id?: string; userId: Types.ObjectId; createdAt?: Date });
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
    await notificationMatchQueue.add(
        'alertDispatchJob',
        { adId },
        {
            jobId: `saved-search-alert:${adId}`,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 }
        }
    );
};

export const processSavedSearchAlertDispatch = async (adId: string): Promise<void> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        logger.warn('Skipping saved-search alert dispatch: invalid adId', { adId });
        return;
    }

    const ad = await Ad.findById(adId)
        .select('_id title description price categoryId location seoSlug status isDeleted')
        .lean<MinimalAdRecord | null>();

    if (!ad || ad.status !== 'live' || (ad as MinimalAdRecord & { isDeleted?: boolean }).isDeleted) {
        return;
    }

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
    
    for (const [userId, matchCount] of userMatchCounts.entries()) {
        try {
            if (!await SavedSearchRateService.canDispatch(userId)) continue;
            if (!await SavedSearchRateService.reserve(userId, adIdText)) continue;

            await dispatchTemplatedNotification(
                userId,
                'SMART_ALERT',
                'SMART_ALERT',
                {
                    adTitle: ad.title,
                    price: String(ad.price),
                    location: locationDisplay
                },
                {
                    adId: adIdText,
                    link,
                    matchedSavedSearches: String(matchCount)
                }
            );
        } catch (error: unknown) {
            logger.error('Failed to dispatch alert to user', {
                userId,
                adId: adIdText,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    logger.info('Saved-search alert dispatch completed', {
        adId: adIdText,
        matchedUsers: userMatchCounts.size
    });
};
