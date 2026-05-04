"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSavedSearchAlertDispatch = exports.enqueueSavedSearchAlertDispatch = exports.deleteSavedSearch = exports.getSavedSearches = exports.createSavedSearch = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SavedSearch_1 = __importDefault(require("@core/models/SavedSearch"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const adQueue_1 = require("@core/queues/adQueue");
const NotificationService_1 = require("./NotificationService");
const logger_1 = __importDefault(require("@core/utils/logger"));
const idUtils_1 = require("@core/utils/idUtils");
const SavedSearchMatchService_1 = require("./savedSearch/SavedSearchMatchService");
const SavedSearchRateService_1 = require("./savedSearch/SavedSearchRateService");
const toSavedSearchContract = (search) => ({
    id: search._id?.toString() || search.id || '',
    userId: search.userId.toString(),
    query: search.query || '',
    categoryId: search.categoryId?.toString(),
    locationId: search.locationId?.toString(),
    priceMin: search.priceMin,
    priceMax: search.priceMax,
    createdAt: search.createdAt ? new Date(search.createdAt).toISOString() : undefined
});
const createSavedSearch = async (userId, payload) => {
    const record = await SavedSearch_1.default.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        query: payload.query?.trim() || '',
        categoryId: (0, idUtils_1.toObjectId)(payload.categoryId) || undefined,
        locationId: (0, idUtils_1.toObjectId)(payload.locationId) || undefined,
        priceMin: typeof payload.priceMin === 'number' ? payload.priceMin : undefined,
        priceMax: typeof payload.priceMax === 'number' ? payload.priceMax : undefined
    });
    return toSavedSearchContract(record.toObject());
};
exports.createSavedSearch = createSavedSearch;
const getSavedSearches = async (userId) => {
    const searches = await SavedSearch_1.default.find({ userId: new mongoose_1.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean();
    return searches.map((search) => toSavedSearchContract(search));
};
exports.getSavedSearches = getSavedSearches;
const deleteSavedSearch = async (userId, id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        return false;
    const removed = await SavedSearch_1.default.findOneAndDelete({
        _id: new mongoose_1.Types.ObjectId(id),
        userId: new mongoose_1.Types.ObjectId(userId)
    });
    return Boolean(removed);
};
exports.deleteSavedSearch = deleteSavedSearch;
const enqueueSavedSearchAlertDispatch = async (adId) => {
    await adQueue_1.notificationMatchQueue.add('alertDispatchJob', { adId }, {
        jobId: `saved-search-alert:${adId}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 }
    });
};
exports.enqueueSavedSearchAlertDispatch = enqueueSavedSearchAlertDispatch;
const processSavedSearchAlertDispatch = async (adId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId)) {
        logger_1.default.warn('Skipping saved-search alert dispatch: invalid adId', { adId });
        return;
    }
    const ad = await Ad_1.default.findById(adId)
        .select('_id title description price categoryId location seoSlug status isDeleted')
        .lean();
    if (!ad || ad.status !== 'live' || ad.isDeleted) {
        return;
    }
    const candidateFilter = SavedSearchMatchService_1.SavedSearchMatchService.buildSearchFilter(ad);
    const candidates = await SavedSearch_1.default.find(candidateFilter)
        .select('_id userId query categoryId locationId priceMin priceMax createdAt')
        .lean();
    if (candidates.length === 0)
        return;
    const userMatchCounts = new Map();
    for (const search of candidates) {
        if (!SavedSearchMatchService_1.SavedSearchMatchService.matches(search, ad))
            continue;
        const userId = search.userId.toString();
        userMatchCounts.set(userId, (userMatchCounts.get(userId) || 0) + 1);
    }
    if (userMatchCounts.size === 0)
        return;
    const adIdText = ad._id.toString();
    const link = ad.seoSlug ? `/ads/${ad.seoSlug}-${adIdText}` : `/ads/${adIdText}`;
    const locationDisplay = ad.location?.display || ad.location?.city || 'your selected area';
    for (const [userId, matchCount] of userMatchCounts.entries()) {
        try {
            if (!await SavedSearchRateService_1.SavedSearchRateService.canDispatch(userId))
                continue;
            if (!await SavedSearchRateService_1.SavedSearchRateService.reserve(userId, adIdText))
                continue;
            await (0, NotificationService_1.dispatchTemplatedNotification)(userId, 'SMART_ALERT', 'SMART_ALERT', {
                adTitle: ad.title,
                price: String(ad.price),
                location: locationDisplay
            }, {
                adId: adIdText,
                link,
                matchedSavedSearches: String(matchCount)
            });
        }
        catch (error) {
            logger_1.default.error('Failed to dispatch alert to user', {
                userId,
                adId: adIdText,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    logger_1.default.info('Saved-search alert dispatch completed', {
        adId: adIdText,
        matchedUsers: userMatchCounts.size
    });
};
exports.processSavedSearchAlertDispatch = processSavedSearchAlertDispatch;
//# sourceMappingURL=SavedSearchService.js.map