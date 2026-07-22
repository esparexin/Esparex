import mongoose, { ClientSession } from 'mongoose';
import { createHash } from 'crypto';
import { getListingRepository } from '../../../../composition/listings';
import { ListingFilter } from '../../../../domains/listings';
import DuplicateEvent from '../../../../models/DuplicateEvent';
import { LISTING_STATUS } from '@esparex/contracts';
import logger from '../../../../utils/logger';

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export type DuplicatePayload = {
    categoryId?: string | mongoose.Types.ObjectId;
    brandId?: string | mongoose.Types.ObjectId;
    modelId?: string | mongoose.Types.ObjectId;
    price?: number;
    condition?: string;
    screenSize?: string;
    deviceCondition?: string;
    images?: string[];
    listingType?: string;
    location?: {
        locationId?: string | mongoose.Types.ObjectId;
        city?: string;
        state?: string;
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

type DuplicateTelemetryEvent = {
    level: 'debug' | 'info' | 'warn' | 'error';
    event: 'fingerprint_generated' | 'duplicate_detected' | 'self_duplicate_skipped' | 'repository_inconsistency' | 'unexpected_exception';
    context: Record<string, unknown>;
    message?: string;
};

const logDuplicateDetection = (telemetry: DuplicateTelemetryEvent) => {
    const msg = `AdDuplicateService: ${telemetry.event} ${telemetry.message ? '- ' + telemetry.message : ''}`;
    switch (telemetry.level) {
        case 'debug': logger.debug(msg, telemetry.context); break;
        case 'info': logger.info(msg, telemetry.context); break;
        case 'warn': logger.warn(msg, telemetry.context); break;
        case 'error': logger.error(msg, telemetry.context); break;
    }
};

// ─────────────────────────────────────────────────
// CORE LOGIC
// ─────────────────────────────────────────────────

export const buildDuplicateFingerprint = (
    payload: DuplicatePayload,
    sellerId: string
): string | undefined => {
    let resolvedCondition: string | undefined;
    switch (payload.listingType?.toLowerCase()) {
        case 'mobile':
        case 'tablet':
            resolvedCondition = payload.deviceCondition;
            break;
        case 'tv':
        case 'display':
            resolvedCondition = payload.screenSize;
            break;
        default:
            resolvedCondition = payload.condition;
            break;
    }

    const normalizedFields = {
        sellerId: normalizeToken(sellerId),
        category: normalizeToken(toObjectIdString(payload.categoryId)),
        brand: normalizeToken(toObjectIdString(payload.brandId)),
        model: normalizeToken(toObjectIdString(payload.modelId)),
        condition: normalizeToken(resolvedCondition),
        priceRange: buildPriceRangeBucket(payload.price),
        locationRadius: buildLocationRadiusToken(payload),
    };

    if (!normalizedFields.sellerId || !normalizedFields.category || !normalizedFields.priceRange || !normalizedFields.locationRadius) {
        logDuplicateDetection({
            level: 'debug',
            event: 'self_duplicate_skipped',
            message: 'insufficient fields to build fingerprint',
            context: {
                sellerId: normalizedFields.sellerId || '(missing)',
                category: normalizedFields.category || '(missing)',
                priceRange: normalizedFields.priceRange || '(missing)',
                locationRadius: normalizedFields.locationRadius || '(missing)',
            }
        });
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

    logDuplicateDetection({
        level: 'debug',
        event: 'fingerprint_generated',
        context: {
            fingerprint,
            fingerprintBase,
            rawPayload: {
                categoryId: payload.categoryId,
                brandId: payload.brandId,
                modelId: payload.modelId,
                price: payload.price,
                resolvedCondition,
                listingType: payload.listingType,
                location: payload.location,
            },
            normalizedFields,
        }
    });

    return fingerprint;
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
        locationId,
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
    if (doc) {
        logDuplicateDetection({
            level: 'info',
            event: 'duplicate_detected',
            message: 'self-duplicate collision during precise check',
            context: {
                sellerId,
                categoryId,
                locationId,
                price,
                brandId,
                modelId,
                listingType,
                matchedAdId: doc.id,
                matchedAdStatus: doc.status,
            }
        });
        return { id: doc.id, status: doc.status };
    }
    return null;
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
        locationId,
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
            logDuplicateDetection({
                level: 'info',
                event: 'duplicate_detected',
                message: 'self-duplicate collision',
                context: {
                    sellerId,
                    matchedAdId: selfDuplicate.id,
                }
            });
            return { isDuplicate: true, riskScore: 100, matchedAdId: selfDuplicate.id, reason: 'Existing active listing detected for this user.' };
        }

        // 2. Fingerprint Check
        const fingerprint = buildDuplicateFingerprint(payload, sellerId);
        if (fingerprint) {
            const query: Record<string, unknown> = {
                duplicateFingerprint: fingerprint,
                status: { $in: [LISTING_STATUS.LIVE, LISTING_STATUS.PENDING] },
                isDeleted: { $ne: true },
            };
            if (session) query.session = session;

            const fingerprintMatch = await getListingRepository().findOne(query as ListingFilter);
            
            if (fingerprintMatch) {
                logDuplicateDetection({
                    level: 'info',
                    event: 'duplicate_detected',
                    message: 'fingerprint collision',
                    context: {
                        fingerprint,
                        sellerId,
                        matchedAdId: fingerprintMatch.id,
                    }
                });
                return { isDuplicate: true, riskScore: 90, matchedAdId: fingerprintMatch.id, reason: 'Duplicate fingerprint detected.' };
            }
        }

        // 3. Cross-User Risk Assessment
        const crossUserRisk = await assessCrossUserDuplicateRisk(payload, sellerId, imageHashes, session);
        return { isDuplicate: crossUserRisk.score > 70, riskScore: crossUserRisk.score, matchedAdId: crossUserRisk.matchedAdId, reason: crossUserRisk.reason };
    }
}
