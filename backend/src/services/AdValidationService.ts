/**
 * Ad Validation Service
 * Handles duplicate detection, fingerprinting, and validation logic
 *
 * Extracted from adService.ts for better separation of concerns
 */

import mongoose, { ClientSession } from 'mongoose';
import logger from '../utils/logger';
import Ad from '../models/Ad';
import User from '../models/User';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { LISTING_TYPE, type ListingTypeValue } from '../../../shared/enums/listingType';
import { getSystemConfigForRead } from './SystemConfigService';
import DuplicateEvent from '../models/DuplicateEvent';
import { createHash } from 'crypto';

// ─────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────

type DuplicatePayload = {
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    price?: unknown;
    condition?: unknown;
    screenSize?: unknown;
    images?: unknown;
    listingType?: string; // 'ad' | 'service' | 'spare_part' — used to scope duplicate checks per type
    location?: {
        locationId?: unknown;
        city?: unknown;
        state?: unknown;
        coordinates?: {
            coordinates?: [number, number];
        };
    };
};

type DuplicateLookupResult = {
    _id: mongoose.Types.ObjectId;
    status: string;
};

type CrossUserDuplicateRisk = {
    score: number;
    matchedAdId?: mongoose.Types.ObjectId;
    reason: string;
    details: Record<string, unknown>;
};

const DUPLICATE_AD_MESSAGE = 'You already have an active listing for this device at this location.';

type DuplicateAwareError = Error & {
    isDuplicate?: boolean;
    code?: string;
};

// ─────────────────────────────────────────────────
// ERROR CREATORS
// ─────────────────────────────────────────────────

export const createDuplicateError = (
    message = DUPLICATE_AD_MESSAGE
): DuplicateAwareError => {
    const err = new Error(message) as DuplicateAwareError;
    err.isDuplicate = true;
    return err;
};

export const createVersionConflictError = (): DuplicateAwareError => {
    const err = new Error('Version conflict: Ad was modified by another process') as DuplicateAwareError;
    err.code = 'VERSION_CONFLICT';
    return err;
};

export const createBadRequestError = (
    message: string,
    code?: string
): DuplicateAwareError => {
    const err = new Error(message) as DuplicateAwareError;
    err.code = code;
    return err;
};

// ─────────────────────────────────────────────────
// ERROR DETECTION HELPERS
// ─────────────────────────────────────────────────

export const extractDocumentVersion = (value: unknown): number | undefined => {
    if (typeof value === 'number' && value >= 0) return value;
    return undefined;
};

export const isDuplicateFingerprintConflict = (error: unknown): boolean => {
    const err = error as {
        code?: number;
        keyPattern?: Record<string, unknown>;
        keyValue?: Record<string, unknown>;
        message?: string;
    };
    if (err?.code !== 11000) return false;
    if (err?.keyPattern?.duplicateFingerprint) return true;
    if (err?.keyValue && 'duplicateFingerprint' in err.keyValue) return true;
    return typeof err?.message === 'string' && err.message.includes('duplicateFingerprint');
};

export const isSeoSlugConflict = (error: unknown): boolean => {
    const err = error as {
        code?: number;
        keyPattern?: Record<string, unknown>;
        keyValue?: Record<string, unknown>;
        message?: string;
    };
    if (err?.code !== 11000) return false;
    if (err?.keyPattern?.seoSlug) return true;
    if (err?.keyValue && 'seoSlug' in err.keyValue) return true;
    return typeof err?.message === 'string' && err.message.includes('seoSlug');
};

// ─────────────────────────────────────────────────
// FINGERPRINTING & DUPLICATE DETECTION
// ─────────────────────────────────────────────────

const toObjectIdString = (value: unknown): string | undefined => {
    if (value instanceof mongoose.Types.ObjectId) {
        return value.toString();
    }
    if (typeof value === 'string') return value.trim() || undefined;
    if (typeof value === 'number') return String(value).trim() || undefined;
    if (
        value &&
        typeof value === 'object' &&
        (('_id' in value) || ('id' in value))
    ) {
        const objValue = value as Record<string, unknown>;
        const candidate = objValue._id ?? objValue.id;
        if (typeof candidate === 'string') return candidate.trim() || undefined;
        if (typeof candidate === 'number') return String(candidate).trim() || undefined;
    }
    if (value && typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
        const maybeObjectId = (value as { toString: () => string }).toString().trim();
        if (mongoose.Types.ObjectId.isValid(maybeObjectId)) return maybeObjectId;
    }
    return undefined;
};

const normalizeToken = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return value
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '');
};

const normalizeNumericToken = (value: unknown): string => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === 'string') {
        const normalized = value.trim();
        if (!normalized) return '';
        const asNumber = Number(normalized);
        if (Number.isFinite(asNumber)) {
            return String(asNumber);
        }
    }
    return '';
};

const buildPriceRangeBucket = (value: unknown): string => {
    const numericPrice = Number(normalizeNumericToken(value));
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return '';
    }
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



export const buildDuplicateFingerprint = (
    payload: DuplicatePayload,
    sellerId: string
): string | undefined => {
    const normalizedFields = {
        sellerId: normalizeToken(sellerId),
        category: normalizeToken(toObjectIdString(payload.categoryId)),
        brand: normalizeToken(toObjectIdString(payload.brandId)),
        model: normalizeToken(toObjectIdString(payload.modelId)),
        condition: normalizeToken(payload.condition || payload.screenSize), // Fallback for backwards compat
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

    const fingerprint = createHash('sha256').update(fingerprintBase).digest('hex').substring(0, 16);

    logger.debug('Duplicate fingerprint generated', {
        fingerprint,
        sellerId,
        normalizedFields,
    });

    return fingerprint;
};

export const buildLegacyDuplicateQuery = (
    payload: DuplicatePayload,
    sellerId: string,
    categoryId: string
): Record<string, unknown> => {
    const locationId = toObjectIdString(payload.location?.locationId);
    const price = typeof payload.price === 'number' ? payload.price : undefined;

    if (!locationId || !price) {
        return {
            sellerId: new mongoose.Types.ObjectId(sellerId),
            status: AD_STATUS.LIVE,
            categoryId: new mongoose.Types.ObjectId(categoryId),
        };
    }

    const priceMargin = price * 0.1;
    return {
        sellerId: new mongoose.Types.ObjectId(sellerId),
        status: AD_STATUS.LIVE,
        categoryId: new mongoose.Types.ObjectId(categoryId),
        'location.locationId': new mongoose.Types.ObjectId(locationId),
        price: { $gte: price - priceMargin, $lte: price + priceMargin },
    };
};

// ─────────────────────────────────────────────────
// DUPLICATE CHECKING LOGIC
// ─────────────────────────────────────────────────

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
        await DuplicateEvent.create(
            [
                {
                    sellerId: event.sellerId ? new mongoose.Types.ObjectId(event.sellerId) : null,
                    adId: event.adId ? new mongoose.Types.ObjectId(event.adId) : null,
                    matchedAdId: event.matchedAdId,
                    action: event.action,
                    reason: event.reason,
                    score: event.score,
                    duplicateFingerprint: event.duplicateFingerprint,
                    details: event.details,
                },
            ],
            session ? { session } : undefined
        );
    } catch (err) {
        logger.error('Failed to log duplicate event', {
            error: err instanceof Error ? err.message : String(err),
            event,
        });
    }
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
        // Scope check to the same listing type — prevents a service from matching an ad
        listingType: listingType || 'ad',
    };

    if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
        const priceMargin = price * 0.1;
        query.price = {
            $gte: price - priceMargin,
            $lte: price + priceMargin
        };
    }

    if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
        query.brandId = new mongoose.Types.ObjectId(brandId);
    }

    if (modelId && mongoose.Types.ObjectId.isValid(modelId)) {
        query.modelId = new mongoose.Types.ObjectId(modelId);
    }

    if (excludeAdId && mongoose.Types.ObjectId.isValid(excludeAdId)) {
        query._id = { $ne: new mongoose.Types.ObjectId(excludeAdId) };
    }

    let queryBuilder = Ad.findOne(query).select('_id status').lean();
    if (session) {
        queryBuilder = queryBuilder.session(session);
    }

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
    const brandId = toObjectIdString(payload.brandId);
    const price = typeof payload.price === 'number' ? payload.price : undefined;

    if (!categoryId || !locationId || !price) {
        return { score: 0, reason: 'Incomplete payload for cross-user duplicate check', details: {} };
    }

    const priceMargin = price * 0.1;
    const priceRange = { $gte: price - priceMargin, $lte: price + priceMargin };

    const imageHashQuery: Record<string, unknown> = {};
    if (payloadImageHashes.length > 0) {
        imageHashQuery.imageHashes = { $in: payloadImageHashes };
    }

    let query = Ad.find({
        categoryId: new mongoose.Types.ObjectId(categoryId),
        'location.locationId': new mongoose.Types.ObjectId(locationId),
        price: priceRange,
        status: { $in: [AD_STATUS.LIVE, 'pending'] },
        sellerId: { $ne: new mongoose.Types.ObjectId(sellerId) },
        ...(brandId && mongoose.Types.ObjectId.isValid(brandId) ? { brandId: new mongoose.Types.ObjectId(brandId) } : {}),
        ...(Object.keys(imageHashQuery).length > 0 ? imageHashQuery : {}),
    })
        .select('_id imageHashes')
        .lean()
        .limit(5);

    if (session) {
        query = query.session(session);
    }

    const potentialMatches = await query;

    if (potentialMatches.length === 0) {
        return { score: 0, reason: 'No cross-user duplicates detected', details: {} };
    }

    const firstMatch = potentialMatches[0] as unknown as { _id: mongoose.Types.ObjectId; imageHashes?: string[] };
    const matchScore = 40 + (payloadImageHashes.length > 0 ? 40 : 0);

    return {
        score: Math.min(matchScore, 80),
        matchedAdId: firstMatch._id,
        reason: 'Similar listings found from other sellers',
        details: {
            matchCount: potentialMatches.length,
            imageHashMatch: payloadImageHashes.length > 0,
            priceRange,
        },
    };
};

// ─────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────

export {
    type DuplicatePayload,
    type DuplicateLookupResult,
    type CrossUserDuplicateRisk,
    type DuplicateAwareError,
};

/**
 * Validates if a seller is within their allowed listing threshold for a specific type.
 * Specifically used to enforce Business Account requirement for high-volume Spare Part sellers.
 */
export const validateSellerTypeThreshold = async (
    sellerId: string,
    listingType: ListingTypeValue
): Promise<{ ok: boolean; reason?: string; code?: string }> => {
    // Currently policy only applies to Spare Parts
    if (listingType !== LISTING_TYPE.SPARE_PART) {
        return { ok: true };
    }

    try {
        const user = await User.findById(sellerId).select('role').lean();
        if (!user) return { ok: false, reason: 'Seller not found', code: 'SELLER_NOT_FOUND' };

        // Business accounts have no threshold limits on spare parts
        if (
            user.role === 'business' || 
            user.role === 'admin' || 
            user.role === 'super_admin' || 
            user.role === 'superadmin'
        ) {
            return { ok: true };
        }

        const config = await getSystemConfigForRead();
        const threshold = config?.listing?.thresholds?.proSparePartLimit ?? 5; // Default 5

        const activeCount = await Ad.countDocuments({
            sellerId: new mongoose.Types.ObjectId(sellerId),
            listingType: LISTING_TYPE.SPARE_PART,
            status: { $in: [AD_STATUS.LIVE, 'pending'] },
            isDeleted: false
        });

        if (activeCount >= threshold) {
            return {
                ok: false,
                reason: `You have reached the limit of ${threshold} spare part listings for individual accounts. Please upgrade to a Business Account to post more.`,
                code: 'BUSINESS_REQUIRED_THRESHOLD'
            };
        }

        return { ok: true };
    } catch (error) {
        logger.error('validateSellerTypeThreshold: Error during validation', { error, sellerId });
        return { ok: true }; // Fail open for safety
    }
};
