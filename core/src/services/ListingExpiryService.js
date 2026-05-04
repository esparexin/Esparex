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
exports.ListingExpiryService = void 0;
const Ad_1 = __importDefault(require("@core/models/Ad"));
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const actor_1 = require("@core/constants/enums/actor");
const StatusMutationService_1 = require("./StatusMutationService");
const events_1 = require("../events");
const logger_1 = __importDefault(require("@core/utils/logger"));
class ListingExpiryService {
    static async runSweep(now = new Date()) {
        const expiringListings = await Ad_1.default.find({
            status: listingStatus_1.LISTING_STATUS.LIVE,
            expiresAt: { $lte: now },
            isDeleted: { $ne: true },
        })
            .select('_id')
            .lean();
        if (expiringListings.length === 0) {
            return {
                expiredCount: 0,
                touchedCount: 0,
                listingIds: [],
            };
        }
        const listingIds = expiringListings
            .map((doc) => String(doc._id))
            .filter((id) => id.length > 0);
        await Ad_1.default.updateMany({ _id: { $in: listingIds } }, {
            $set: {
                isSpotlight: false,
                isChatLocked: true,
            },
        });
        const expiredCount = await (0, StatusMutationService_1.mutateStatusesBulk)('ad', listingIds, listingStatus_1.LISTING_STATUS.EXPIRED, { type: actor_1.ACTOR_TYPE.SYSTEM, id: 'listing_expiry_cron' }, 'Automated expiry');
        await events_1.lifecycleEvents.dispatch('listing.expired.bulk', {
            count: expiredCount,
            listingIds,
            source: 'ListingExpiryService',
        });
        const { invalidateAdFeedCaches } = await Promise.resolve().then(() => __importStar(require('../utils/redisCache')));
        await invalidateAdFeedCaches();
        logger_1.default.info('[ListingExpiryService] Expiry sweep completed', {
            expiredCount,
            touchedCount: listingIds.length,
        });
        return {
            expiredCount,
            touchedCount: listingIds.length,
            listingIds,
        };
    }
}
exports.ListingExpiryService = ListingExpiryService;
//# sourceMappingURL=ListingExpiryService.js.map