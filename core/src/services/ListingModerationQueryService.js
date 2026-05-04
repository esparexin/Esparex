"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectId = exports.isValidListingType = exports.getPublicLiveListingCounts = exports.getModerationCounts = exports.getModerationListingById = exports.listModerationListings = exports.normalizeModerationStatusFilter = exports.MODERATION_STATUSES = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const AdAggregationService_1 = require("./ad/AdAggregationService");
const AdDetailService_1 = require("./ad/AdDetailService");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const FeedVisibilityGuard_1 = require("@core/utils/FeedVisibilityGuard");
exports.MODERATION_STATUSES = [
    listingStatus_1.LISTING_STATUS.PENDING,
    listingStatus_1.LISTING_STATUS.LIVE,
    listingStatus_1.LISTING_STATUS.REJECTED,
    listingStatus_1.LISTING_STATUS.EXPIRED,
    listingStatus_1.LISTING_STATUS.SOLD,
    listingStatus_1.LISTING_STATUS.DEACTIVATED,
];
const isModerationStatus = (status) => exports.MODERATION_STATUSES.includes(status);
const normalizeModerationStatusFilter = (status) => {
    if (!status || status === 'all')
        return [...exports.MODERATION_STATUSES];
    const normalized = status.trim().toLowerCase();
    if (!isModerationStatus(normalized))
        return [...exports.MODERATION_STATUSES];
    return normalized;
};
exports.normalizeModerationStatusFilter = normalizeModerationStatusFilter;
const listModerationListings = async (filters, pagination) => {
    const normalizedStatusFilter = Array.isArray(filters.status)
        ? filters.status
        : (0, exports.normalizeModerationStatusFilter)(typeof filters.status === 'string' ? filters.status : undefined);
    return (0, AdAggregationService_1.getAds)({
        status: normalizedStatusFilter,
        sellerId: filters.sellerId,
        categoryId: filters.categoryId,
        brandId: filters.brandId,
        modelId: filters.modelId,
        isSpotlight: filters.isSpotlight,
        locationId: filters.locationId,
        search: filters.q,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        createdAfter: filters.createdAfter,
        createdBefore: filters.createdBefore,
        listingType: filters.listingType,
        sortBy: filters.sortBy,
    }, pagination, {
        trackListingTypeCompatMetrics: false,
    });
};
exports.listModerationListings = listModerationListings;
const getModerationListingById = async (id) => {
    return (0, AdDetailService_1.getAnyAdById)(id);
};
exports.getModerationListingById = getModerationListingById;
const createEmptyStatusMap = () => ({
    pending: 0,
    live: 0,
    rejected: 0,
    expired: 0,
    sold: 0,
    deactivated: 0,
});
const createEmptyCounts = () => ({
    total: 0,
    ...createEmptyStatusMap(),
});
const createEmptyListingTypeCounts = () => ({
    ad: 0,
    service: 0,
    spare_part: 0,
});
const getModerationCounts = async (listingType) => {
    const publicLiveCounts = await (0, exports.getPublicLiveListingCounts)(listingType);
    const match = {
        isDeleted: { $ne: true },
        status: { $in: [...exports.MODERATION_STATUSES] },
    };
    if (listingType) {
        match.listingType = listingType;
    }
    const now = new Date();
    const spotlightMatch = {
        ...(0, FeedVisibilityGuard_1.buildPublicAdFilter)(),
        isSpotlight: true,
        spotlightExpiresAt: { $gt: now },
    };
    if (listingType) {
        spotlightMatch.listingType = listingType;
    }
    const [rows, spotlight] = await Promise.all([
        Ad_1.default.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        listingType: { $ifNull: ['$listingType', 'ad'] },
                        status: '$status',
                    },
                    count: { $sum: 1 },
                },
            },
        ]),
        Ad_1.default.countDocuments(spotlightMatch),
    ]);
    const byListingType = {
        ad: createEmptyCounts(),
        service: createEmptyCounts(),
        spare_part: createEmptyCounts(),
    };
    const byStatus = createEmptyStatusMap();
    let total = 0;
    rows.forEach((row) => {
        const type = row._id.listingType;
        const status = row._id.status;
        if (!listingType_1.LISTING_TYPE_VALUES.includes(type))
            return;
        if (!isModerationStatus(status))
            return;
        byListingType[type][status] += row.count;
        byListingType[type].total += row.count;
        byStatus[status] += row.count;
        total += row.count;
    });
    byStatus.live = publicLiveCounts.total;
    for (const type of listingType_1.LISTING_TYPE_VALUES) {
        byListingType[type].live = publicLiveCounts.byListingType[type];
    }
    return {
        total,
        ...byStatus,
        spotlight,
        byStatus,
        byListingType,
    };
};
exports.getModerationCounts = getModerationCounts;
const getPublicLiveListingCounts = async (listingType) => {
    const match = {
        ...(0, FeedVisibilityGuard_1.buildPublicAdFilter)(),
    };
    if (listingType) {
        match.listingType = listingType;
    }
    const rows = await Ad_1.default.aggregate([
        {
            $match: match,
        },
        {
            $group: {
                _id: { $ifNull: ['$listingType', 'ad'] },
                count: { $sum: 1 },
            },
        },
    ]);
    const byListingType = createEmptyListingTypeCounts();
    let total = 0;
    for (const row of rows) {
        if (!listingType_1.LISTING_TYPE_VALUES.includes(row._id)) {
            continue;
        }
        byListingType[row._id] += row.count;
        total += row.count;
    }
    return {
        total,
        byListingType,
    };
};
exports.getPublicLiveListingCounts = getPublicLiveListingCounts;
const isValidListingType = (value) => typeof value === 'string' && listingType_1.LISTING_TYPE_VALUES.includes(value);
exports.isValidListingType = isValidListingType;
const isValidObjectId = (id) => mongoose_1.default.Types.ObjectId.isValid(id);
exports.isValidObjectId = isValidObjectId;
//# sourceMappingURL=ListingModerationQueryService.js.map