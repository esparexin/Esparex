import mongoose, { Types } from 'mongoose';
import SavedSearch from '../models/SavedSearch';
import Ad from '../models/Ad';
import { notificationMatchQueue } from '../queues/adQueue';
import { createInAppNotification } from './NotificationService';
import redisClient from '../config/redis';
import logger from '../utils/logger';
import type { SavedSearchCreatePayload } from '../../../shared/schemas/savedSearch.schema';

type SavedSearchRecord = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    query?: string;
    categoryId?: Types.ObjectId;
    locationId?: Types.ObjectId;
    priceMin?: number;
    priceMax?: number;
    createdAt?: Date;
};

type MinimalAdRecord = {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    price: number;
    categoryId?: Types.ObjectId;
    location?: {
        locationId?: Types.ObjectId;
        city?: string;
        display?: string;
    };
    seoSlug?: string;
    status?: string;
    isDeleted?: boolean;
};

const MAX_ALERTS_PER_USER_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const USER_ALERT_RATE_KEY_PREFIX = 'saved-search-alerts:rate';
const USER_AD_DEDUPE_KEY_PREFIX = 'saved-search-alerts:dedupe';
const USER_AD_DEDUPE_TTL_SECONDS = 24 * 60 * 60;

const toObjectId = (value: unknown): Types.ObjectId | null => {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (typeof value === 'string' && Types.ObjectId.isValid(value)) return new Types.ObjectId(value);
    return null;
};

const toLocationDisplay = (ad: MinimalAdRecord): string => {
    const location = ad.location;
    if (!location) return 'your selected area';
    return location.display || location.city || 'your selected area';
};

const normalizeSearchText = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
};

const matchesKeyword = (query: string | undefined, adText: string): boolean => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return true;
    return tokens.every((token) => adText.includes(token));
};

const matchesCategory = (search: SavedSearchRecord, ad: MinimalAdRecord): boolean => {
    if (!search.categoryId) return true;
    if (!ad.categoryId) return false;
    return search.categoryId.toString() === ad.categoryId.toString();
};

const matchesLocation = (search: SavedSearchRecord, ad: MinimalAdRecord): boolean => {
    if (!search.locationId) return true;
    const adLocationId = ad.location?.locationId;
    if (!adLocationId) return false;
    return search.locationId.toString() === adLocationId.toString();
};

const matchesPrice = (search: SavedSearchRecord, ad: MinimalAdRecord): boolean => {
    const price = Number(ad.price);
    if (!Number.isFinite(price)) return false;

    if (typeof search.priceMin === 'number' && price < search.priceMin) return false;
    if (typeof search.priceMax === 'number' && price > search.priceMax) return false;
    return true;
};

const buildSearchFilter = (ad: MinimalAdRecord): Record<string, unknown> => {
    const and: Record<string, unknown>[] = [];

    if (ad.categoryId) {
        and.push({
            $or: [
                { categoryId: { $exists: false } },
                { categoryId: null },
                { categoryId: ad.categoryId }
            ]
        });
    }

    const adLocationId = ad.location?.locationId;
    if (adLocationId) {
        and.push({
            $or: [
                { locationId: { $exists: false } },
                { locationId: null },
                { locationId: adLocationId }
            ]
        });
    }

    if (Number.isFinite(ad.price)) {
        and.push({
            $or: [
                { priceMin: { $exists: false } },
                { priceMin: null },
                { priceMin: { $lte: ad.price } }
            ]
        });
        and.push({
            $or: [
                { priceMax: { $exists: false } },
                { priceMax: null },
                { priceMax: { $gte: ad.price } }
            ]
        });
    }

    if (and.length === 0) return {};
    return { $and: and };
};

const getRateLimitKey = (userId: string): string => {
    const hourBucket = new Date().toISOString().slice(0, 13);
    return `${USER_ALERT_RATE_KEY_PREFIX}:${userId}:${hourBucket}`;
};

const canDispatchAlertForUser = async (userId: string): Promise<boolean> => {
    const rateLimitKey = getRateLimitKey(userId);
    const current = await redisClient.incr(rateLimitKey);
    if (current === 1) {
        await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
    }
    return current <= MAX_ALERTS_PER_USER_PER_HOUR;
};

const reserveAdNotificationForUser = async (userId: string, adId: string): Promise<boolean> => {
    const dedupeKey = `${USER_AD_DEDUPE_KEY_PREFIX}:${adId}:${userId}`;
    const reserved = await redisClient.set(
        dedupeKey,
        '1',
        'EX',
        USER_AD_DEDUPE_TTL_SECONDS,
        'NX'
    );
    return reserved === 'OK';
};

const toSavedSearchContract = (search: SavedSearchRecord & { id?: string; _id?: Types.ObjectId }) => ({
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

    return toSavedSearchContract(record.toObject() as SavedSearchRecord & { _id: Types.ObjectId });
};

export const getSavedSearches = async (userId: string) => {
    const searches = await SavedSearch.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean<SavedSearchRecord[]>();

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

    if (!ad || ad.isDeleted || ad.status !== 'live') {
        return;
    }

    const candidateFilter = buildSearchFilter(ad);
    const candidates = await SavedSearch.find(candidateFilter)
        .select('_id userId query categoryId locationId priceMin priceMax createdAt')
        .lean<SavedSearchRecord[]>();

    if (candidates.length === 0) {
        return;
    }

    const adText = `${ad.title || ''} ${ad.description || ''}`.toLowerCase();

    const userMatchCounts = new Map<string, number>();
    for (const search of candidates) {
        if (!matchesCategory(search, ad)) continue;
        if (!matchesLocation(search, ad)) continue;
        if (!matchesPrice(search, ad)) continue;
        if (!matchesKeyword(search.query, adText)) continue;

        const userId = search.userId.toString();
        userMatchCounts.set(userId, (userMatchCounts.get(userId) || 0) + 1);
    }

    if (userMatchCounts.size === 0) {
        return;
    }

    const adIdText = ad._id.toString();
    const link = ad.seoSlug ? `/ads/${ad.seoSlug}-${adIdText}` : `/ads/${adIdText}`;
    const locationText = toLocationDisplay(ad);
    const message = `${ad.title} • \u20B9${ad.price} • ${locationText}`;

    const users = Array.from(userMatchCounts.entries());
    const BATCH_SIZE = 100;
    for (let offset = 0; offset < users.length; offset += BATCH_SIZE) {
        const batch = users.slice(offset, offset + BATCH_SIZE);
        await Promise.all(batch.map(async ([userId, matchCount]) => {
            const hasBudget = await canDispatchAlertForUser(userId);
            if (!hasBudget) return;

            const reserved = await reserveAdNotificationForUser(userId, adIdText);
            if (!reserved) return;

            await createInAppNotification(
                userId,
                'SMART_ALERT',
                'New listing matches your saved search.',
                message,
                {
                    adId: adIdText,
                    adTitle: ad.title,
                    price: String(ad.price),
                    location: locationText,
                    link,
                    matchedSavedSearches: String(matchCount)
                }
            );
        }));
    }

    logger.info('Saved-search alert dispatch completed', {
        adId: adIdText,
        matchedUsers: userMatchCounts.size
    });
};
