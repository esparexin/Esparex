"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdDuplicateService = exports.logDuplicateEvent = exports.assessCrossUserDuplicateRisk = exports.findExistingSelfDuplicate = exports.buildDuplicateFingerprint = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = require("crypto");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const DuplicateEvent_1 = __importDefault(require("@core/models/DuplicateEvent"));
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const logger_1 = __importDefault(require("@core/utils/logger"));
// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────
const toObjectIdString = (value) => {
    if (value instanceof mongoose_1.default.Types.ObjectId)
        return value.toString();
    if (typeof value === 'string')
        return value.trim() || undefined;
    if (typeof value === 'number')
        return String(value).trim() || undefined;
    if (value && typeof value === 'object' && (('_id' in value) || ('id' in value))) {
        const objValue = value;
        const candidate = objValue._id ?? objValue.id;
        if (typeof candidate === 'string')
            return candidate.trim() || undefined;
        if (typeof candidate === 'number')
            return String(candidate).trim() || undefined;
    }
    return undefined;
};
const normalizeToken = (value) => {
    if (typeof value !== 'string')
        return '';
    return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
};
const normalizeNumericToken = (value) => {
    const val = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(val) ? String(val) : '';
};
const buildPriceRangeBucket = (value) => {
    const numericPrice = Number(normalizeNumericToken(value));
    if (!Number.isFinite(numericPrice) || numericPrice < 0)
        return '';
    const bucketSize = 500;
    const lowerBound = Math.floor(numericPrice / bucketSize) * bucketSize;
    const upperBound = lowerBound + bucketSize - 1;
    return `${lowerBound}-${upperBound}`;
};
const buildLocationRadiusToken = (payload) => {
    const locationId = toObjectIdString(payload.location?.locationId);
    if (locationId)
        return locationId.toLowerCase();
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
const buildDuplicateFingerprint = (payload, sellerId) => {
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
    return (0, crypto_1.createHash)('sha256').update(fingerprintBase).digest('hex').substring(0, 16);
};
exports.buildDuplicateFingerprint = buildDuplicateFingerprint;
const findExistingSelfDuplicate = async (sellerId, categoryId, locationId, price, brandId, modelId, excludeAdId, session, listingType) => {
    if (!locationId)
        return null;
    const query = {
        sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
        status: { $in: [listingStatus_1.LISTING_STATUS.LIVE, 'pending'] },
        isDeleted: { $ne: true },
        categoryId: new mongoose_1.default.Types.ObjectId(categoryId),
        'location.locationId': new mongoose_1.default.Types.ObjectId(locationId),
        listingType: listingType || 'ad',
    };
    if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
        const priceMargin = price * 0.1;
        query.price = { $gte: price - priceMargin, $lte: price + priceMargin };
    }
    if (brandId && mongoose_1.default.Types.ObjectId.isValid(brandId))
        query.brandId = new mongoose_1.default.Types.ObjectId(brandId);
    if (modelId && mongoose_1.default.Types.ObjectId.isValid(modelId))
        query.modelId = new mongoose_1.default.Types.ObjectId(modelId);
    if (excludeAdId && mongoose_1.default.Types.ObjectId.isValid(excludeAdId))
        query._id = { $ne: new mongoose_1.default.Types.ObjectId(excludeAdId) };
    const queryBuilder = Ad_1.default.findOne(query).select('_id status').lean();
    if (session)
        queryBuilder.session(session);
    return (await queryBuilder);
};
exports.findExistingSelfDuplicate = findExistingSelfDuplicate;
const assessCrossUserDuplicateRisk = async (payload, sellerId, payloadImageHashes, session) => {
    const categoryId = toObjectIdString(payload.categoryId);
    const locationId = toObjectIdString(payload.location?.locationId);
    const price = typeof payload.price === 'number' ? payload.price : undefined;
    if (!categoryId || !locationId || !price) {
        return { score: 0, reason: 'Incomplete payload for cross-user duplicate check', details: {} };
    }
    const priceMargin = price * 0.1;
    const priceRange = { $gte: price - priceMargin, $lte: price + priceMargin };
    let query = Ad_1.default.find({
        categoryId: new mongoose_1.default.Types.ObjectId(categoryId),
        'location.locationId': new mongoose_1.default.Types.ObjectId(locationId),
        price: priceRange,
        status: { $in: [listingStatus_1.LISTING_STATUS.LIVE, 'pending'] },
        sellerId: { $ne: new mongoose_1.default.Types.ObjectId(sellerId) },
        ...(payloadImageHashes.length > 0 ? { imageHashes: { $in: payloadImageHashes } } : {}),
    })
        .select('_id imageHashes')
        .lean()
        .limit(5);
    if (session)
        query = query.session(session);
    const potentialMatches = await query;
    if (potentialMatches.length === 0) {
        return { score: 0, reason: 'No cross-user duplicates detected', details: {} };
    }
    const firstMatch = potentialMatches[0];
    const matchScore = 40 + (payloadImageHashes.length > 0 ? 40 : 0);
    return {
        score: Math.min(matchScore, 80),
        matchedAdId: firstMatch._id,
        reason: 'Similar listings found from other sellers',
        details: { matchCount: potentialMatches.length, imageHashMatch: payloadImageHashes.length > 0, priceRange },
    };
};
exports.assessCrossUserDuplicateRisk = assessCrossUserDuplicateRisk;
const logDuplicateEvent = async (event, session) => {
    try {
        if (!event.sellerId || !mongoose_1.default.Types.ObjectId.isValid(event.sellerId))
            return;
        const duplicateEvent = new DuplicateEvent_1.default({
            sellerId: new mongoose_1.default.Types.ObjectId(event.sellerId),
            adId: event.adId ? new mongoose_1.default.Types.ObjectId(String(event.adId)) : undefined,
            matchedAdId: event.matchedAdId,
            action: event.action,
            reason: event.reason || 'Duplicate detected',
            score: event.score,
            duplicateFingerprint: event.duplicateFingerprint,
            details: event.details,
        });
        await duplicateEvent.save(session ? { session } : undefined);
    }
    catch (err) {
        logger_1.default.error('Failed to log duplicate event', { error: String(err), event });
    }
};
exports.logDuplicateEvent = logDuplicateEvent;
/**
 * AdDuplicateService
 * Handles high-concurrency duplicate detection and risk assessment.
 */
class AdDuplicateService {
    static async checkDuplicate(payload, sellerId, imageHashes = [], session) {
        // 1. Precise Self-Duplicate Check
        const selfDuplicate = payload.categoryId
            ? await (0, exports.findExistingSelfDuplicate)(sellerId, String(payload.categoryId), payload.location?.locationId ? String(payload.location.locationId) : undefined, payload.price, payload.brandId ? String(payload.brandId) : undefined, payload.modelId ? String(payload.modelId) : undefined, undefined, session, payload.listingType)
            : null;
        if (selfDuplicate) {
            return { isDuplicate: true, riskScore: 100, matchedAdId: selfDuplicate._id, reason: 'Existing active listing detected for this user.' };
        }
        // 2. Fingerprint Check
        const fingerprint = (0, exports.buildDuplicateFingerprint)(payload, sellerId);
        if (fingerprint) {
            const fingerprintMatch = await Ad_1.default.findOne({
                duplicateFingerprint: fingerprint,
                status: { $in: [listingStatus_1.LISTING_STATUS.LIVE, listingStatus_1.LISTING_STATUS.PENDING] }
            }).session(session).select('_id').lean();
            if (fingerprintMatch) {
                return { isDuplicate: true, riskScore: 90, matchedAdId: fingerprintMatch._id, reason: 'Duplicate fingerprint detected.' };
            }
        }
        // 3. Cross-User Risk Assessment
        const crossUserRisk = await (0, exports.assessCrossUserDuplicateRisk)(payload, sellerId, imageHashes, session);
        return { isDuplicate: crossUserRisk.score > 70, riskScore: crossUserRisk.score, matchedAdId: crossUserRisk.matchedAdId, reason: crossUserRisk.reason };
    }
}
exports.AdDuplicateService = AdDuplicateService;
//# sourceMappingURL=AdDuplicateService.js.map