"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusinesses = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Business_1 = __importDefault(require("@core/models/Business"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const LocationNormalizer_1 = require("@core/services/location/LocationNormalizer");
const serialize_1 = require("@core/utils/serialize");
const businessStatus_1 = require("@core/utils/businessStatus");
const adStatus_1 = require("@core/constants/enums/adStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const toObjectId = (value) => {
    if (value instanceof mongoose_1.default.Types.ObjectId)
        return value;
    if (typeof value === 'string' && mongoose_1.default.Types.ObjectId.isValid(value)) {
        return new mongoose_1.default.Types.ObjectId(value);
    }
    return null;
};
const toSortableNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};
const getBusinesses = async (filters) => {
    const normalizedLocationId = typeof filters.locationId === 'string' && mongoose_1.default.Types.ObjectId.isValid(filters.locationId)
        ? new mongoose_1.default.Types.ObjectId(filters.locationId)
        : null;
    const normalizedListingCategoryId = typeof filters.listingCategoryId === 'string' && mongoose_1.default.Types.ObjectId.isValid(filters.listingCategoryId)
        ? new mongoose_1.default.Types.ObjectId(filters.listingCategoryId)
        : null;
    const normalizedBrandId = typeof filters.brandId === 'string' && mongoose_1.default.Types.ObjectId.isValid(filters.brandId)
        ? new mongoose_1.default.Types.ObjectId(filters.brandId)
        : null;
    const excludedBusinessId = typeof filters.excludeBusinessId === 'string' && mongoose_1.default.Types.ObjectId.isValid(filters.excludeBusinessId)
        ? new mongoose_1.default.Types.ObjectId(filters.excludeBusinessId)
        : null;
    const latitude = typeof filters.latitude === 'number' ? filters.latitude : Number(filters.latitude);
    const longitude = typeof filters.longitude === 'number' ? filters.longitude : Number(filters.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const radiusKmRaw = typeof filters.radiusKm === 'number' ? filters.radiusKm : Number(filters.radiusKm);
    const radiusKm = Number.isFinite(radiusKmRaw) ? Math.min(Math.max(radiusKmRaw, 1), 100) : 35;
    const serviceOnly = filters.serviceOnly === true ||
        filters.serviceOnly === 'true' ||
        Boolean(normalizedListingCategoryId);
    const query = {
        status: businessStatus_1.publishedBusinessStatusQuery,
        isDeleted: { $ne: true }
    };
    if (excludedBusinessId) {
        query._id = { $ne: excludedBusinessId };
    }
    if (normalizedLocationId && !hasCoordinates) {
        query.locationId = normalizedLocationId;
    }
    const parsedLimit = typeof filters.limit === 'number' ? filters.limit : Number(filters.limit || 20);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 20;
    const candidateLimit = Math.min(Math.max(safeLimit * 5, safeLimit), 60);
    let candidates = [];
    if (hasCoordinates) {
        candidates = await Business_1.default.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    distanceField: 'distanceMeters',
                    spherical: true,
                    maxDistance: radiusKm * 1000,
                    query,
                    key: 'location.coordinates'
                }
            },
            { $limit: candidateLimit }
        ]);
    }
    else {
        const finder = Business_1.default.find(query)
            .limit(candidateLimit)
            .sort({ createdAt: -1 });
        candidates = await finder.lean();
    }
    if (candidates.length === 0)
        return [];
    const candidateIds = candidates
        .map((business) => toObjectId(business._id))
        .filter((value) => Boolean(value));
    const baseServiceMatch = {
        businessId: { $in: candidateIds },
        listingType: listingType_1.LISTING_TYPE.SERVICE,
        status: adStatus_1.AD_STATUS.LIVE,
        isDeleted: { $ne: true }
    };
    const matchingServiceMatch = { ...baseServiceMatch };
    if (normalizedListingCategoryId) {
        matchingServiceMatch.categoryId = normalizedListingCategoryId;
    }
    const brandMatchedServiceMatch = normalizedBrandId && normalizedListingCategoryId
        ? {
            ...baseServiceMatch,
            categoryId: normalizedListingCategoryId,
            brandId: normalizedBrandId
        }
        : {};
    const [activeServiceCounts, matchingServiceCounts, brandMatchedServiceCounts] = await Promise.all([
        Ad_1.default.aggregate([
            { $match: baseServiceMatch },
            { $group: { _id: '$businessId', count: { $sum: 1 } } }
        ]),
        normalizedListingCategoryId || normalizedBrandId || serviceOnly
            ? Ad_1.default.aggregate([
                { $match: matchingServiceMatch },
                { $group: { _id: '$businessId', count: { $sum: 1 } } }
            ])
            : Promise.resolve([]),
        normalizedBrandId && normalizedListingCategoryId
            ? Ad_1.default.aggregate([
                { $match: brandMatchedServiceMatch },
                { $group: { _id: '$businessId', count: { $sum: 1 } } }
            ])
            : Promise.resolve([])
    ]);
    const activeServiceCountMap = new Map(activeServiceCounts.map((entry) => [String(entry._id), entry.count]));
    const matchingServiceCountMap = new Map(matchingServiceCounts.map((entry) => [String(entry._id), entry.count]));
    const brandMatchedServiceCountMap = new Map(brandMatchedServiceCounts.map((entry) => [String(entry._id), entry.count]));
    const filteredCandidates = candidates.filter((candidate) => {
        const businessId = String(candidate._id);
        const activeServicesCount = activeServiceCountMap.get(businessId) || 0;
        const matchingServicesCount = matchingServiceCountMap.get(businessId) || 0;
        if (!serviceOnly)
            return true;
        if (normalizedListingCategoryId || normalizedBrandId)
            return matchingServicesCount > 0;
        return activeServicesCount > 0;
    });
    const enriched = (filteredCandidates
        .map((biz) => {
        const serialized = (0, serialize_1.serializeDoc)(biz);
        if (serialized.location) {
            serialized.location = (0, LocationNormalizer_1.normalizeLocationResponse)(serialized.location);
        }
        const businessId = String(serialized._id || serialized.id);
        const activeServicesCount = activeServiceCountMap.get(businessId) || 0;
        const matchingServicesCount = matchingServiceCountMap.get(businessId) || 0;
        const brandMatchedServicesCount = brandMatchedServiceCountMap.get(businessId) || 0;
        const distanceKm = typeof biz.distanceMeters === 'number'
            ? Number((biz.distanceMeters / 1000).toFixed(1))
            : undefined;
        return {
            ...serialized,
            activeServicesCount,
            matchingServicesCount,
            brandMatchedServicesCount,
            ...(typeof distanceKm === 'number' ? { distanceKm } : {})
        };
    }))
        .sort((left, right) => {
        const brandMatchedDiff = right.brandMatchedServicesCount - left.brandMatchedServicesCount;
        if (brandMatchedDiff !== 0)
            return brandMatchedDiff;
        const matchingDiff = right.matchingServicesCount - left.matchingServicesCount;
        if (matchingDiff !== 0)
            return matchingDiff;
        const activeDiff = right.activeServicesCount - left.activeServicesCount;
        if (activeDiff !== 0)
            return activeDiff;
        const leftDistance = typeof left.distanceKm === 'number' ? left.distanceKm : Number.POSITIVE_INFINITY;
        const rightDistance = typeof right.distanceKm === 'number' ? right.distanceKm : Number.POSITIVE_INFINITY;
        if (leftDistance !== rightDistance)
            return leftDistance - rightDistance;
        const verifiedDiff = Number(Boolean(right.isVerified)) - Number(Boolean(left.isVerified));
        if (verifiedDiff !== 0)
            return verifiedDiff;
        const trustDiff = toSortableNumber(right.trustScore) - toSortableNumber(left.trustScore);
        if (trustDiff !== 0)
            return trustDiff;
        return new Date(String(right.createdAt || 0)).getTime() - new Date(String(left.createdAt || 0)).getTime();
    });
    return enriched.slice(0, safeLimit);
};
exports.getBusinesses = getBusinesses;
//# sourceMappingURL=BusinessSearchService.js.map