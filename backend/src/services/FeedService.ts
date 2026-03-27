import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import redisClient from '../config/redis';
import Ad from '../models/Ad';
import Boost from '../models/Boost';
import { buildAdMatchStage, buildHomeFeedPipeline, type AdFilters } from './AdQueryService';
import { normalizeAdImagesForResponse } from './adQuery/AdQueryHelpers';
import { buildGeoNearStage, normalizeGeoInput } from '../utils/GeoUtils';
import { CACHE_TTLS, getCache, setCache } from '../utils/redisCache';
import type { HomeFeedResponse } from '../../../shared/types/Api';

import logger from '../utils/logger';
import { FeedDecisionEngine } from './FeedDecisionEngine';

type LocationLevel = 'country' | 'state' | 'district' | 'city' | 'area' | 'village';

export interface HomeFeedCursor {
    createdAt: string;
    id: string;
}

export interface HomeFeedRequest {
    cursor?: string | Partial<HomeFeedCursor>;
    limit?: number;
    location?: string;
    locationId?: string;
    level?: LocationLevel;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    categoryId?: string;
}

type FeedAdRecord = Record<string, unknown> & {
    _id?: unknown;
    id?: unknown;
    sellerId?: unknown;
    createdAt?: unknown;
    isSpotlight?: boolean;
    isBoosted?: boolean;
};

type FeedMergeResult = {
    ads: FeedAdRecord[];
    hasRemaining: boolean;
};

type WarmupResult = {
    warmedKeys: number;
    skippedKeys: number;
    durationMs: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 48;
const HOME_FEED_CACHE_TTL_SECONDS = 60;
export const FEED_CACHE_VERSION = 'v1' as const;
const PROMOTED_RATIO_CAP = 0.3;
const PROMOTED_STREAK_CAP = 2;
const FEED_BUILD_LOCK_KEY = 'feed:home:build-lock';
const FEED_BUILD_LOCK_TTL_SECONDS = 5;
const FEED_BUILD_LOCK_WAIT_MS = 1200;
const FEED_BUILD_LOCK_POLL_MS = 120;
const FEED_LOCK_RELEASE_SCRIPT = 'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';

const normalizePositiveInt = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
};

type ParsedHomeFeedCursor = {
    createdAt: Date;
    id: string | null;
    mode: 'compound' | 'legacy';
};

const parseCursorObject = (raw: unknown): ParsedHomeFeedCursor | null => {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const createdAtValue = record.createdAt;
    const idValue = record.id;
    if (typeof createdAtValue !== 'string') return null;
    const createdAt = new Date(createdAtValue);
    if (Number.isNaN(createdAt.getTime())) return null;
    const normalizedId = typeof idValue === 'string' && mongoose.Types.ObjectId.isValid(idValue)
        ? new mongoose.Types.ObjectId(idValue).toHexString()
        : null;
    return {
        createdAt,
        id: normalizedId,
        mode: normalizedId ? 'compound' : 'legacy'
    };
};

const parseCursor = (cursor: HomeFeedRequest['cursor']): ParsedHomeFeedCursor | null => {
    if (!cursor) return null;

    if (typeof cursor === 'object') {
        return parseCursorObject(cursor);
    }

    if (typeof cursor !== 'string' || cursor.trim().length === 0) {
        return null;
    }

    const raw = cursor.trim();
    try {
        const parsedJson = JSON.parse(raw) as unknown;
        const parsedObjectCursor = parseCursorObject(parsedJson);
        if (parsedObjectCursor) return parsedObjectCursor;
    } catch {
        // Backward compatibility path: timestamp-only cursor string.
    }

    const legacyDate = new Date(raw);
    if (Number.isNaN(legacyDate.getTime())) return null;
    return {
        createdAt: legacyDate,
        id: null,
        mode: 'legacy'
    };
};

const toLocationKey = (input: HomeFeedRequest): string => {
    const raw = (
        input.locationId ||
        input.location ||
        (Number.isFinite(input.lat) && Number.isFinite(input.lng)
            ? `${Number(input.lat).toFixed(3)},${Number(input.lng).toFixed(3)}`
            : 'global')
    );
    return String(raw).trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
};

const toCategoryKey = (input: HomeFeedRequest): string => {
    const raw = input.categoryId || input.category || 'all';
    return String(raw).trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
};

const toCursorKey = (cursor: ParsedHomeFeedCursor | null): string => {
    if (!cursor) return 'start';
    const createdAtKey = cursor.createdAt.toISOString().replace(/[^a-z0-9]/gi, '_');
    if (!cursor.id) return `legacy_${createdAtKey}`;
    return `${createdAtKey}_${cursor.id}`;
};

const buildHomeFeedCacheKey = (
    input: HomeFeedRequest,
    cursor: ParsedHomeFeedCursor | null,
    limit: number
): string => {
    const city = String(input.location || input.locationId || (input.lat && input.lng ? `${input.lat}_${input.lng}` : 'all')).trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const state = String(input.level === 'state' ? input.location : 'all').trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const radiusKm = input.radiusKm || (input.lat && input.lng ? 50 : 0);
    const category = String(input.categoryId || input.category || 'all').trim().toLowerCase().replace(/[^a-z0-9,._-]+/g, '-');
    const sort = 'newest';
    const page = toCursorKey(cursor);
    return `home_feed:${city}:${state}:${radiusKm}:${category}:${sort}:${page}_${limit}`;
};

const extractAdId = (ad: FeedAdRecord): string => {
    const candidate = ad._id ?? ad.id;
    if (!candidate) return '';
    return String(candidate).trim();
};

const extractSellerId = (ad: FeedAdRecord): string | null => {
    const raw = ad.sellerId;
    if (raw instanceof mongoose.Types.ObjectId) {
        return raw.toHexString();
    }
    if (typeof raw === 'string' && mongoose.Types.ObjectId.isValid(raw)) {
        return new mongoose.Types.ObjectId(raw).toHexString();
    }
    if (raw && typeof raw === 'object' && typeof (raw as { toString?: () => string }).toString === 'function') {
        const candidate = (raw as { toString: () => string }).toString();
        if (mongoose.Types.ObjectId.isValid(candidate)) {
            return new mongoose.Types.ObjectId(candidate).toHexString();
        }
    }
    return null;
};

const toCreatedAtMs = (ad: FeedAdRecord): number => {
    const parsed = new Date(String(ad.createdAt ?? 0)).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const sortByCreatedAtDesc = (ads: FeedAdRecord[]): FeedAdRecord[] =>
    [...ads].sort((left, right) => toCreatedAtMs(right) - toCreatedAtMs(left));

const normalizeAds = (ads: FeedAdRecord[]): FeedAdRecord[] =>
    ads.map((ad) => normalizeAdImagesForResponse(ad as Record<string, unknown>) as FeedAdRecord);

const compareObjectIdHex = (left: string, right: string): number => {
    if (left === right) return 0;
    return left < right ? -1 : 1;
};

const extractObjectIdHex = (ad: FeedAdRecord): string | null => {
    const raw = ad._id ?? ad.id;
    if (raw instanceof mongoose.Types.ObjectId) {
        return raw.toHexString();
    }
    if (typeof raw === 'string' && mongoose.Types.ObjectId.isValid(raw)) {
        return new mongoose.Types.ObjectId(raw).toHexString();
    }
    return null;
};

const filterBeforeCursor = (ads: FeedAdRecord[], cursor: ParsedHomeFeedCursor | null): FeedAdRecord[] => {
    if (!cursor) return ads;
    const cursorCreatedAtMs = cursor.createdAt.getTime();

    return ads.filter((ad) => {
        const createdAtMs = toCreatedAtMs(ad);
        if (createdAtMs < cursorCreatedAtMs) {
            return true;
        }
        if (createdAtMs > cursorCreatedAtMs) {
            return false;
        }

        if (!cursor.id) {
            return false;
        }

        const adIdHex = extractObjectIdHex(ad);
        if (!adIdHex) return false;
        return compareObjectIdHex(adIdHex, cursor.id) < 0;
    });
};

const findNextUnique = (
    source: FeedAdRecord[],
    startIndex: number,
    seen: Set<string>
): { nextIndex: number; ad?: FeedAdRecord } => {
    let index = startIndex;
    while (index < source.length) {
        const candidate = source[index];
        index += 1;
        if (!candidate) continue;
        const candidateId = extractAdId(candidate);
        if (!candidateId || seen.has(candidateId)) continue;
        return { nextIndex: index, ad: candidate };
    }
    return { nextIndex: source.length };
};

const hasMoreUnique = (source: FeedAdRecord[], startIndex: number, seen: Set<string>): boolean => {
    const probe = findNextUnique(source, startIndex, seen);
    return Boolean(probe.ad);
};

const mergeRankedFeed = (
    spotlightAds: FeedAdRecord[],
    boostedAds: FeedAdRecord[],
    organicAds: FeedAdRecord[],
    limit: number
): FeedMergeResult => {
    const promotedQueue = [...sortByCreatedAtDesc(spotlightAds), ...sortByCreatedAtDesc(boostedAds)];
    const organicQueue = sortByCreatedAtDesc(organicAds);

    const promotedLimit = Math.floor(limit * PROMOTED_RATIO_CAP);
    const merged: FeedAdRecord[] = [];
    const seen = new Set<string>();
    let promotedIndex = 0;
    let organicIndex = 0;
    let promotedStreak = 0;
    let promotedCount = 0;

    while (merged.length < limit && (promotedIndex < promotedQueue.length || organicIndex < organicQueue.length)) {
        const canTakePromoted = (
            promotedIndex < promotedQueue.length &&
            promotedCount < promotedLimit &&
            promotedStreak < PROMOTED_STREAK_CAP
        );

        if (canTakePromoted) {
            const selection = findNextUnique(promotedQueue, promotedIndex, seen);
            promotedIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = extractAdId(selection.ad);
                seen.add(adId);
                merged.push(selection.ad);
                promotedCount += 1;
                promotedStreak += 1;
                continue;
            }
        }

        if (organicIndex < organicQueue.length) {
            const selection = findNextUnique(organicQueue, organicIndex, seen);
            organicIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = extractAdId(selection.ad);
                seen.add(adId);
                merged.push(selection.ad);
                promotedStreak = 0;
                continue;
            }
        }

        if (
            promotedIndex < promotedQueue.length &&
            promotedCount < promotedLimit &&
            promotedStreak < PROMOTED_STREAK_CAP
        ) {
            const selection = findNextUnique(promotedQueue, promotedIndex, seen);
            promotedIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = extractAdId(selection.ad);
                seen.add(adId);
                merged.push(selection.ad);
                promotedCount += 1;
                promotedStreak += 1;
                continue;
            }
        }

        break;
    }

    return {
        ads: merged,
        hasRemaining:
            hasMoreUnique(promotedQueue, promotedIndex, seen) ||
            hasMoreUnique(organicQueue, organicIndex, seen)
    };
};



const buildHomeFeed = async (
    input: HomeFeedRequest,
    limit: number,
    cursor: ParsedHomeFeedCursor | null
): Promise<HomeFeedResponse> => {
    const { LISTING_TYPE } = await import('../../../shared/enums/listingType');
    const startedAt = Date.now();
    
    // 1. Resolve Match Criteria
    const baseFilters: AdFilters = {
        listingType: LISTING_TYPE.AD,
        sortBy: 'newest',
        ...(typeof input.location === 'string' && input.location.trim().length > 0
            ? { location: input.location.trim() }
            : {}),
        ...(typeof input.locationId === 'string' && mongoose.Types.ObjectId.isValid(input.locationId)
            ? { locationId: input.locationId }
            : {}),
        ...(typeof input.level === 'string'
            ? { level: input.level }
            : {}),
        ...(typeof input.categoryId === 'string' && input.categoryId.trim().length > 0
            ? { categoryId: input.categoryId.trim() }
            : {}),
        ...(typeof input.category === 'string' && input.category.trim().length > 0
            ? { category: input.category.trim() }
            : {})
    };

    const matchStage = await buildAdMatchStage(baseFilters);

    if (process.env.FEED_DEBUG === 'true') {
        logger.debug(`[FeedDebug] Final Match Filter`, { matchStage });
    }

    // 2. Fetch Active Boosts (Fast Indexed Query)
    const now = new Date();
    const boostCandidates = await Boost.find({
        entityType: 'ad',
        isActive: true,
        startsAt: { $lte: now },
        endsAt: { $gt: now }
    })
        .select('entityId')
        .sort({ createdAt: -1 })
        .limit(200) // Safety cap
        .lean<Array<{ entityId?: mongoose.Types.ObjectId }>>();

    const boostedIds = boostCandidates
        .map((entry) => entry.entityId)
        .filter((id): id is mongoose.Types.ObjectId => id instanceof mongoose.Types.ObjectId);

    if (process.env.FEED_DEBUG === 'true') {
        logger.debug(`[FeedDebug] Boosted Ranking Injection`, { count: boostedIds.length, ids: boostedIds.map(String) });
    }

    // 2.5 Resolve Geo Location ($geoNear MUST be the first stage if coordinates are present)
    const { lat, lng, hasGeo } = normalizeGeoInput(input.lat, input.lng);
    const normalizedLevel = typeof input.level === 'string' ? input.level.toLowerCase() : undefined;
    const shouldUseGeo = hasGeo && normalizedLevel !== 'state' && normalizedLevel !== 'country';
    // Use user-provided radius, or default to 50km if Geo is used. (Hard-cap at 500km)
    const safeRadius = shouldUseGeo 
        ? Math.min(Math.max(Number(input.radiusKm) || 50, 1), 500) 
        : 0;
    
    let geoStage: mongoose.PipelineStage | undefined = undefined;
    if (shouldUseGeo) {
        geoStage = buildGeoNearStage({
            lng,
            lat,
            radiusKm: safeRadius,
            query: matchStage
        });
        // Clear out matchStage so it doesn't run twice (geoStage incorporates it)
        Object.keys(matchStage).forEach(key => delete matchStage[key]);
    }

    // 3. Unified Aggregation with shared pipeline utility
    const pipeline = buildHomeFeedPipeline(matchStage, boostedIds, limit, geoStage, cursor ?? undefined);
    const [facetResults] = await Ad.aggregate(pipeline);

    const spotlightAds = filterBeforeCursor(
        (facetResults?.spotlight || []).map((ad: any) => ({
            ...ad,
            isSpotlight: true,
            isBoosted: false
        })),
        cursor
    );
    const boostedAds = filterBeforeCursor(
        (facetResults?.boosted || []).map((ad: any) => ({
            ...ad,
            isSpotlight: false,
            isBoosted: true
        })),
        cursor
    );
    const organicAds = filterBeforeCursor(
        (facetResults?.organic || []).map((ad: any) => ({
            ...ad,
            isSpotlight: false,
            isBoosted: false
        })),
        cursor
    );

    // 4. Merge results using existing logic (to preserve business rules like PROMOTED_RATIO_CAP)
    const merged = mergeRankedFeed(spotlightAds, boostedAds, organicAds, limit);

    // 5. Fallback Logic (Reuse existing but slightly optimized)
    let isFallbackResult = false;
    const isStrictLocation = Boolean(input.locationId || input.location || shouldUseGeo);

    if (!cursor && merged.ads.length < 4 && isStrictLocation) {
        isFallbackResult = true;
        const seenIds = new Set(merged.ads.map(extractAdId).filter(Boolean));

        // PR 7 - FeedDecisionEngine Progressive Expansion
        // Pass locationId so the engine uses indexed locationPath queries (unified with AdQueryService).
        // Pass state so regional neighbor expansion works when coordinates are unavailable.
        const engineResult = await FeedDecisionEngine.getFallbackFeed(
            {
                locationId: input.locationId,
                city: typeof input.location === 'string' ? input.location.trim() : undefined,
                state: input.level === 'state' && typeof input.location === 'string' ? input.location.trim() : undefined,
                lat: shouldUseGeo ? input.lat : undefined,
                lng: shouldUseGeo ? input.lng : undefined,
            },
            Array.from(seenIds),
            limit - merged.ads.length,
            input.categoryId
        );

        const sortedBucket = engineResult.ads;
        for (const ad of sortedBucket) {
            if (merged.ads.length >= limit) break;
            const id = extractAdId(ad);
            if (!id || seenIds.has(id)) continue;
            seenIds.add(id);
            merged.ads.push(ad);
        }
    }

    const lastAd = merged.ads[merged.ads.length - 1];
    const lastAdCursor: HomeFeedCursor | null = lastAd
        ? {
            createdAt: new Date(String(lastAd.createdAt ?? '')).toISOString(),
            id: extractObjectIdHex(lastAd) || String(extractAdId(lastAd))
        }
        : null;

    logger.debug('Home feed build timings', { 
        durationMs: Date.now() - startedAt,
        adsCount: merged.ads.length,
        isFallback: isFallbackResult
    });

    return {
        ads: merged.ads.map(ad => normalizeAdImagesForResponse(ad as any)) as HomeFeedResponse['ads'],
        nextCursor: merged.hasRemaining ? lastAdCursor : null,
        hasMore: merged.hasRemaining && merged.ads.length > 0,
        isFallback: isFallbackResult
    };
}

const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms));
};

const tryAcquireFeedBuildLock = async (token: string): Promise<boolean> => {
    try {
        const acquired = await redisClient.set(
            FEED_BUILD_LOCK_KEY,
            token,
            'EX',
            FEED_BUILD_LOCK_TTL_SECONDS,
            'NX'
        );
        return acquired === 'OK';
    } catch {
        return false;
    }
};

const releaseFeedBuildLock = async (token: string): Promise<void> => {
    try {
        await redisClient.eval(
            FEED_LOCK_RELEASE_SCRIPT,
            1,
            FEED_BUILD_LOCK_KEY,
            token
        );
    } catch {
        // no-op
    }
};

export const getHomeFeedAds = async (input: HomeFeedRequest = {}): Promise<HomeFeedResponse> => {
    const limit = Math.min(MAX_LIMIT, Math.max(1, normalizePositiveInt(input.limit, DEFAULT_LIMIT)));
    const parsedCursor = parseCursor(input.cursor);
    const cacheKey = buildHomeFeedCacheKey(input, parsedCursor, limit);
    const startedAt = Date.now();

    const cached = await getCache<HomeFeedResponse>(cacheKey);
    if (cached) {
        if (process.env.FEED_DEBUG === 'true') {
            logger.debug(`[FeedDebug] Cache HIT for key: ${cacheKey}`);
        }
        return cached;
    }

    if (process.env.FEED_DEBUG === 'true') {
        logger.debug(`[FeedDebug] Cache MISS for key: ${cacheKey}`);
    }

    const lockToken = randomUUID();
    const hasBuildLock = await tryAcquireFeedBuildLock(lockToken);

    if (!hasBuildLock) {
        const waitUntil = Date.now() + FEED_BUILD_LOCK_WAIT_MS;
        while (Date.now() < waitUntil) {
            await sleep(FEED_BUILD_LOCK_POLL_MS);
            const waitedCache = await getCache<HomeFeedResponse>(cacheKey);
            if (waitedCache) {
                return waitedCache;
            }
        }
    }

    try {
        const builtFeed = await buildHomeFeed(input, limit, parsedCursor);
        const existingCache = await getCache<HomeFeedResponse>(cacheKey);
        if (!existingCache) {
            await setCache(
                cacheKey,
                builtFeed,
                CACHE_TTLS.HOME_FEED ?? HOME_FEED_CACHE_TTL_SECONDS
            );
        }

        const totalMs = Date.now() - startedAt;
        if (totalMs > 2000) {
            logger.warn('Home feed generation exceeded 2s target', {
                durationMs: totalMs,
                cacheKey
            });
        }

        return builtFeed;
    } finally {
        if (hasBuildLock) {
            await releaseFeedBuildLock(lockToken);
        }
    }
};

const getWarmLocationInputs = (): Array<Pick<HomeFeedRequest, 'location'>> => {
    const raw = process.env.HOME_FEED_WARM_LOCATIONS;
    if (!raw) return [];
    return raw
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .map((location) => ({ location }));
};

export const warmHomeFeedCache = async (): Promise<WarmupResult> => {
    const startedAt = Date.now();
    const limit = DEFAULT_LIMIT;
    let warmedKeys = 0;
    let skippedKeys = 0;

    const globalRequest: HomeFeedRequest = { limit };
    const globalKeyPageOne = buildHomeFeedCacheKey(globalRequest, null, limit);
    const cachedGlobalPageOne = await getCache<HomeFeedResponse>(globalKeyPageOne);
    const globalPageOne = cachedGlobalPageOne ?? await getHomeFeedAds(globalRequest);
    if (cachedGlobalPageOne) {
        skippedKeys += 1;
    } else {
        warmedKeys += 1;
    }

    if (globalPageOne.nextCursor) {
        const pageTwoCursor = parseCursor(globalPageOne.nextCursor);
        const globalKeyPageTwo = buildHomeFeedCacheKey(globalRequest, pageTwoCursor, limit);
        const cachedGlobalPageTwo = await getCache<HomeFeedResponse>(globalKeyPageTwo);
        if (cachedGlobalPageTwo) {
            skippedKeys += 1;
        } else {
            await getHomeFeedAds({
                ...globalRequest,
                cursor: globalPageOne.nextCursor
            });
            warmedKeys += 1;
        }
    }

    const locationInputs = getWarmLocationInputs();
    for (const locationInput of locationInputs) {
        const request: HomeFeedRequest = {
            ...locationInput,
            limit
        };
        const cacheKey = buildHomeFeedCacheKey(request, null, limit);
        const cached = await getCache<HomeFeedResponse>(cacheKey);
        if (cached) {
            skippedKeys += 1;
            continue;
        }
        await getHomeFeedAds(request);
        warmedKeys += 1;
    }

    const durationMs = Date.now() - startedAt;
    logger.info('Home feed warmup completed', {
        warmedKeys,
        skippedKeys,
        durationMs
    });

    return {
        warmedKeys,
        skippedKeys,
        durationMs
    };
};
