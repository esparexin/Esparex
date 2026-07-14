import mongoose, { ClientSession } from 'mongoose';
import { createHash } from 'crypto';
import { getListingRepository } from '../composition/listings';
import { ListingFilter } from '../domains/listings';
import DuplicateEvent from '../models/DuplicateEvent';
import { LISTING_STATUS } from '@esparex/shared';
import logger from '../utils/logger';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export type DuplicatePayload = {
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    price?: unknown;
    condition?: unknown;
    screenSize?: unknown;
    images?: unknown;
    listingType?: string;
    location?: {
        locationId?: unknown;
        city?: unknown;
        state?: unknown;
        coordinates?: {
            coordinates?: [number, number];
        };
    };
};

export type DuplicateLookupResult = {
    id: string;
    status: string;
};

export type CrossUserDuplicateRisk = {
    score: number;
    matchedAdId?: string;
    reason: string;
    details: Record<string, unknown>;
};

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    riskScore: number;
    matchedAdId?: string;
    reason?: string;
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

const toObjectIdString = (value: unknown): string | undefined => {
    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (typeof value === 'string') return value.trim() || undefined;
    if (typeof value === 'number') return String(value).trim() || undefined;
    if (value && typeof value === 'object' && (('_id' in value) || ('id' in value))) {
        const objValue = value as Record<string, unknown>;
        const candidate = objValue._id ?? objValue.id;
        if (typeof candidate === 'string') return candidate.trim() || undefined;
        if (typeof candidate === 'number') return String(candidate).trim() || undefined;
    }
    return undefined;
};

const normalizeToken = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
};

const normalizeNumericToken = (value: unknown): string => {
    const val = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(val) ? String(val) : '';
};

const buildPriceRangeBucket = (value: unknown): string => {
    const numericPrice = Number(normalizeNumericToken(value));
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return '';
    const bucketSize = 500;
    const lowerBound = Math.floor(numericPrice / bucketSize) * bucketSize;
    const upperBound = lowerBound + bucketSize - 1;
    return `${lowerBound}-${upperBound}`;
};

const buildLocationRadiusToken = (payload: DuplicatePayload): string => {
    const locationId = toObjectIdString(payload.location?.locationId);
    if (locationId) return locationId.toLowerCase();

    const cityToken = normalizeToken(payload.location?.city);
    const stateToken = normalizeToken(payload.location?.state);
    const lng = payload.location?.coordinates?.coordinates?.[0];
    const lat = payload.location?.coordinates?.coordinates?.[1];
    const roundedLng = typeof lng === 'number' && Number.isFinite(lng) ? lng.toFixed(2) : '';
    const roundedLat = typeof lat === 'number' && Number.isFinite(lat) ? lat.toFixed(2) : '';

    const locationParts = [cityToken, stateToken, roundedLng, roundedLat].filter(Boolean);
    return locationParts.join(':');
};

// ─────────────────────────────────────────────────
// CORE LOGIC
// ─────────────────────────────────────────────────

export const buildDuplicateFingerprint = (
    payload: DuplicatePayload,
    sellerId: string
): string | undefined => {
    const normalizedFields = {
        sellerId: normalizeToken(sellerId),
        category: normalizeToken(toObjectIdString(payload.categoryId)),
        brand: normalizeToken(toObjectIdString(payload.brandId)),
        model: normalizeToken(toObjectIdString(payload.modelId)),
        condition: normalizeToken(payload.condition || payload.screenSize),
        priceRange: buildPriceRangeBucket(payload.price),
        locationRadius: buildLocationRadiusToken(payload),
    };

    if (!normalizedFields.sellerId || !normalizedFields.category || !normalizedFields.priceRange || !normalizedFields.locationRadius) {
        return undefined;
    }

    const fingerprintBase = [
        `type:${normalizeToken(payload.listingType || 'ad')}`,
        `seller:${normalizedFields.sellerId}`,
        `category:${normalizedFields.category}`,
        `brand:${normalizedFields.brand || 'na'}`,
        `model:${normalizedFields.model || 'na'}`,
        `condition:${normalizedFields.condition || 'na'}`,
        `priceRange:${normalizedFields.priceRange}`,
        `locationRadius:${normalizedFields.locationRadius}`,
    ].join('|');

    return createHash('sha256').update(fingerprintBase).digest('hex').substring(0, 16);
};

export const findExistingSelfDuplicate = async (
    sellerId: string,
    categoryId: string,
    locationId?: string,
    price?: number,
    brandId?: string,
    modelId?: string,
    excludeAdId?: string,
    session?: ClientSession,
    listingType?: string
): Promise<DuplicateLookupResult | null> => {
    if (!locationId) return null;

    const query: Record<string, unknown> = {
        sellerId: sellerId,
        status: { $in: [LISTING_STATUS.LIVE, 'pending'] },
        isDeleted: { $ne: true },
        categoryId: categoryId,
        'location.locationId': locationId,
        listingType: listingType || 'ad',
    };

    if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
        const priceMargin = price * 0.1;
        query.price = { $gte: price - priceMargin, $lte: price + priceMargin };
    }

    if (brandId) query.brandId = brandId;
    if (modelId) query.modelId = modelId;
    if (excludeAdId) query._id = { $ne: excludeAdId };
    if (session) query.session = session;

    const doc = await getListingRepository().findOne(query as ListingFilter);
    return doc ? { id: doc.id, status: doc.status } : null;
};

export const assessCrossUserDuplicateRisk = async (
    payload: DuplicatePayload,
    sellerId: string,
    payloadImageHashes: string[],
    session?: ClientSession
): Promise<CrossUserDuplicateRisk> => {
    const categoryId = toObjectIdString(payload.categoryId);
    const locationId = toObjectIdString(payload.location?.locationId);
    const price = typeof payload.price === 'number' ? payload.price : undefined;

    if (!categoryId || !locationId || !price) {
        return { score: 0, reason: 'Incomplete payload for cross-user duplicate check', details: {} };
    }

    const priceMargin = price * 0.1;
    const priceRange = { $gte: price - priceMargin, $lte: price + priceMargin };

    const query: Record<string, unknown> = {
        categoryId,
        'location.locationId': locationId,
        price: priceRange,
        status: { $in: [LISTING_STATUS.LIVE, 'pending'] },
        sellerId: { $ne: sellerId },
        ...(payloadImageHashes.length > 0 ? { imageHashes: { $in: payloadImageHashes } } : {}),
    };
    if (session) query.session = session;

    const potentialMatches = await getListingRepository().findWithLimit(query as ListingFilter, { createdAt: -1 }, 5);

    if (potentialMatches.length === 0) {
        return { score: 0, reason: 'No cross-user duplicates detected', details: {} };
    }

    const firstMatch = potentialMatches[0];
    const matchScore = 40 + (payloadImageHashes.length > 0 ? 40 : 0);

    return {
        score: Math.min(matchScore, 80),
        matchedAdId: firstMatch.id,
        reason: 'Similar listings found from other sellers',
        details: { matchCount: potentialMatches.length, imageHashMatch: payloadImageHashes.length > 0, priceRange },
    };
};

export const logDuplicateEvent = async (
    event: {
        sellerId?: string;
        adId?: mongoose.Types.ObjectId | string;
        matchedAdId?: mongoose.Types.ObjectId | string;
        action: 'flagged' | 'blocked';
        reason?: string;
        score?: number;
        duplicateFingerprint?: string;
        details?: Record<string, unknown>;
    },
    session?: ClientSession
) => {
    try {
        if (!event.sellerId || !mongoose.Types.ObjectId.isValid(event.sellerId)) return;
        const duplicateEvent = new DuplicateEvent({
            sellerId: new mongoose.Types.ObjectId(event.sellerId),
            adId: event.adId ? new mongoose.Types.ObjectId(String(event.adId)) : undefined,
            matchedAdId: event.matchedAdId ? new mongoose.Types.ObjectId(String(event.matchedAdId)) : undefined,
            action: event.action,
            reason: event.reason || 'Duplicate detected',
            score: event.score,
            duplicateFingerprint: event.duplicateFingerprint,
            details: event.details,
        });
        await duplicateEvent.save(session ? { session } : undefined);
    } catch (err) {
        logger.error('Failed to log duplicate event', { error: String(err), event });
    }
};

/**
 * AdDuplicateService
 * Handles high-concurrency duplicate detection and risk assessment.
 */
export class AdDuplicateService {
    static async checkDuplicate(
        payload: DuplicatePayload,
        sellerId: string,
        imageHashes: string[] = [],
        session?: ClientSession
    ): Promise<DuplicateCheckResult> {
        // 1. Precise Self-Duplicate Check
        const selfDuplicate = payload.categoryId
            ? await findExistingSelfDuplicate(
                sellerId,
                String(payload.categoryId),
                payload.location?.locationId ? String(payload.location.locationId) : undefined,
                payload.price as number,
                payload.brandId ? String(payload.brandId) : undefined,
                payload.modelId ? String(payload.modelId) : undefined,
                undefined,
                session,
                payload.listingType
            )
            : null;

        if (selfDuplicate) {
            return { isDuplicate: true, riskScore: 100, matchedAdId: selfDuplicate.id, reason: 'Existing active listing detected for this user.' };
        }

        // 2. Fingerprint Check
        const fingerprint = buildDuplicateFingerprint(payload, sellerId);
        if (fingerprint) {
            const query: Record<string, unknown> = {
                duplicateFingerprint: fingerprint,
                status: { $in: [LISTING_STATUS.LIVE, LISTING_STATUS.PENDING] }
            };
            if (session) query.session = session;

            const fingerprintMatch = await getListingRepository().findOne(query as ListingFilter);
            
            if (fingerprintMatch) {
                return { isDuplicate: true, riskScore: 90, matchedAdId: fingerprintMatch.id, reason: 'Duplicate fingerprint detected.' };
            }
        }

        // 3. Cross-User Risk Assessment
        const crossUserRisk = await assessCrossUserDuplicateRisk(payload, sellerId, imageHashes, session);
        return { isDuplicate: crossUserRisk.score > 70, riskScore: crossUserRisk.score, matchedAdId: crossUserRisk.matchedAdId, reason: crossUserRisk.reason };
    }
}
