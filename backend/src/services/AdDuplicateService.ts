import mongoose, { ClientSession } from 'mongoose';
import { createHash } from 'crypto';
import Ad from '../models/Ad';
import DuplicateEvent from '../models/DuplicateEvent';
import { AD_STATUS } from '../../../shared/enums/adStatus';
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
    _id: mongoose.Types.ObjectId;
    status: string;
};

export type CrossUserDuplicateRisk = {
    score: number;
    matchedAdId?: mongoose.Types.ObjectId;
    reason: string;
    details: Record<string, unknown>;
};

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    riskScore: number;
    matchedAdId?: mongoose.Types.ObjectId;
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
        sellerId: new mongoose.Types.ObjectId(sellerId),
        status: { $in: [AD_STATUS.LIVE, 'pending'] },
        isDeleted: { $ne: true },
        categoryId: new mongoose.Types.ObjectId(categoryId),
        'location.locationId': new mongoose.Types.ObjectId(locationId),
        listingType: listingType || 'ad',
    };

    if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
        const priceMargin = price * 0.1;
        query.price = { $gte: price - priceMargin, $lte: price + priceMargin };
    }

    if (brandId && mongoose.Types.ObjectId.isValid(brandId)) query.brandId = new mongoose.Types.ObjectId(brandId);
    if (modelId && mongoose.Types.ObjectId.isValid(modelId)) query.modelId = new mongoose.Types.ObjectId(modelId);
    if (excludeAdId && mongoose.Types.ObjectId.isValid(excludeAdId)) query._id = { $ne: new mongoose.Types.ObjectId(excludeAdId) };

    const queryBuilder = Ad.findOne(query).select('_id status').lean();
    if (session) queryBuilder.session(session);

    return (await queryBuilder) as DuplicateLookupResult | null;
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

    let query = Ad.find({
        categoryId: new mongoose.Types.ObjectId(categoryId),
        'location.locationId': new mongoose.Types.ObjectId(locationId),
        price: priceRange,
        status: { $in: [AD_STATUS.LIVE, 'pending'] },
        sellerId: { $ne: new mongoose.Types.ObjectId(sellerId) },
        ...(payloadImageHashes.length > 0 ? { imageHashes: { $in: payloadImageHashes } } : {}),
    })
    .select('_id imageHashes')
    .lean()
    .limit(5);

    if (session) query = query.session(session);
    const potentialMatches = await query;

    if (potentialMatches.length === 0) {
        return { score: 0, reason: 'No cross-user duplicates detected', details: {} };
    }

    const firstMatch = potentialMatches[0] as unknown as { _id: mongoose.Types.ObjectId };
    const matchScore = 40 + (payloadImageHashes.length > 0 ? 40 : 0);

    return {
        score: Math.min(matchScore, 80),
        matchedAdId: firstMatch._id,
        reason: 'Similar listings found from other sellers',
        details: { matchCount: potentialMatches.length, imageHashMatch: payloadImageHashes.length > 0, priceRange },
    };
};

export const logDuplicateEvent = async (
    event: {
        sellerId?: string;
        adId?: mongoose.Types.ObjectId | string;
        matchedAdId?: mongoose.Types.ObjectId;
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
            matchedAdId: event.matchedAdId,
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
            return { isDuplicate: true, riskScore: 100, matchedAdId: selfDuplicate._id, reason: 'Existing active listing detected for this user.' };
        }

        // 2. Fingerprint Check
        const fingerprint = buildDuplicateFingerprint(payload, sellerId);
        if (fingerprint) {
            const fingerprintMatch = await Ad.findOne({
                duplicateFingerprint: fingerprint,
                status: { $in: [AD_STATUS.LIVE, AD_STATUS.PENDING] }
            }).session(session as ClientSession).select('_id').lean<{ _id: mongoose.Types.ObjectId } | null>();
            
            if (fingerprintMatch) {
                return { isDuplicate: true, riskScore: 90, matchedAdId: fingerprintMatch._id, reason: 'Duplicate fingerprint detected.' };
            }
        }

        // 3. Cross-User Risk Assessment
        const crossUserRisk = await assessCrossUserDuplicateRisk(payload, sellerId, imageHashes, session);
        return { isDuplicate: crossUserRisk.score > 70, riskScore: crossUserRisk.score, matchedAdId: crossUserRisk.matchedAdId, reason: crossUserRisk.reason };
    }
}
