"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdSortStage = exports.extractLocationIdFromAd = exports.normalizeAdImagesForResponse = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const s3_1 = require("@core/utils/s3");
const normalizeAdImagesForResponse = (ad) => {
    const rawImages = Array.isArray(ad.images) ? ad.images : [];
    const images = (0, s3_1.sanitizePersistedImageUrls)(rawImages.filter((image) => typeof image === 'string'), { fallbackToPlaceholder: false, allowPlaceholder: false });
    return {
        ...ad,
        images
    };
};
exports.normalizeAdImagesForResponse = normalizeAdImagesForResponse;
const extractLocationIdFromAd = (ad) => {
    const locationValue = ad.location;
    if (!locationValue || typeof locationValue !== 'object')
        return null;
    const location = locationValue;
    const locationId = location.locationId;
    if (typeof locationId === 'string' && mongoose_1.default.Types.ObjectId.isValid(locationId)) {
        return locationId;
    }
    if (locationId &&
        typeof locationId === 'object' &&
        typeof locationId.toString === 'function') {
        const candidate = locationId.toString();
        if (mongoose_1.default.Types.ObjectId.isValid(candidate))
            return candidate;
    }
    return null;
};
exports.extractLocationIdFromAd = extractLocationIdFromAd;
const buildAdSortStage = (filters) => {
    const sort = {};
    if (filters.sortBy === 'distance') {
        sort.distance = 1;
        sort.createdAt = -1;
    }
    else if (filters.sortBy === 'newest') {
        sort.createdAt = -1;
    }
    else if (filters.sortBy === 'price-low') {
        sort.price = 1;
    }
    else if (filters.sortBy === 'price-high') {
        sort.price = -1;
    }
    else if (filters.sortBy === 'trending') {
        sort.rankScore = -1;
    }
    else {
        sort.listingQualityScore = -1;
        sort.createdAt = -1;
    }
    return sort;
};
exports.buildAdSortStage = buildAdSortStage;
//# sourceMappingURL=AdQueryHelpers.js.map