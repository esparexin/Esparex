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
exports.promoteAdLogic = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("@core/utils/AppError");
const logger_1 = __importDefault(require("@core/utils/logger"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const db_1 = require("@core/config/db");
const listingType_1 = require("@core/constants/enums/listingType");
const adStatus_1 = require("@core/constants/enums/adStatus");
const lifecycle_1 = require("@core/constants/enums/lifecycle");
const WalletService_1 = require("../WalletService");
const redisCache_1 = require("@core/utils/redisCache");
const promoteAdLogic = async (id, days = 7, type = 'spotlight_hp', userId, isAdmin = false) => {
    const Boost = (await Promise.resolve().then(() => __importStar(require('@core/models/Boost')))).default;
    const User = (await Promise.resolve().then(() => __importStar(require('@core/models/User')))).default;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        throw new AppError_1.AppError('Invalid Ad ID', 400);
    const ad = await Ad_1.default.findById(id);
    if (!ad)
        return null;
    if (ad.listingType === listingType_1.LISTING_TYPE.SPARE_PART) {
        throw new AppError_1.AppError('Spare parts are not eligible for Spotlight promotion.', 403);
    }
    if (!isAdmin && ad.sellerId.toString() !== userId.toString()) {
        throw new AppError_1.AppError('Unauthorized', 403);
    }
    if (!isAdmin) {
        const user = await User.findById(userId).select('trustScore strikeCount');
        if (!user || user.trustScore < 30 || user.strikeCount >= 2) {
            throw new AppError_1.AppError('Account ineligible for promotion due to trust or moderation standing.', 403);
        }
        if (ad.moderationStatus === 'auto_hidden' || ad.moderationStatus === lifecycle_1.LIFECYCLE_STATUS.REJECTED || ad.moderationStatus === 'held_for_review') {
            throw new AppError_1.AppError('Ad must be in normal standing to be promoted.', 403);
        }
        if (!ad.isSpotlight) {
            const activePromotions = await Ad_1.default.countDocuments({
                sellerId: userId,
                isSpotlight: true,
                status: adStatus_1.AD_STATUS.LIVE
            });
            if (activePromotions >= 3) {
                throw new AppError_1.AppError('Maximum 3 active spotlight promotions allowed concurrently.', 403);
            }
        }
    }
    const startsAt = new Date();
    let endsAt = new Date();
    if (ad.isSpotlight && ad.spotlightExpiresAt && ad.spotlightExpiresAt > new Date()) {
        endsAt = new Date(ad.spotlightExpiresAt.getTime());
    }
    endsAt.setDate(endsAt.getDate() + days);
    if (ad.expiresAt && ad.expiresAt < endsAt) {
        throw new AppError_1.AppError('Ad expires before boost duration. Extend ad expiry first.', 400);
    }
    const connection = (0, db_1.getUserConnection)();
    const session = await connection.startSession();
    try {
        await session.withTransaction(async () => {
            if (!isAdmin) {
                const promotionCost = Math.abs(Math.floor(days));
                if (promotionCost === 0)
                    throw new AppError_1.AppError('Promotion cost cannot be zero', 400, 'INVALID_PROMOTION_COST');
                try {
                    await (0, WalletService_1.consumeCredit)({
                        userId,
                        creditType: 'spotlightCredits',
                        amount: promotionCost,
                        reason: `Ad promotion - ${days} days`,
                        metadata: { adId: id, type, days },
                        session
                    });
                }
                catch (error) {
                    throw new AppError_1.AppError(error instanceof Error ? error.message : 'Insufficient spotlight credits', 402);
                }
            }
            if (ad.isSpotlight) {
                await Boost.updateOne({ entityId: ad._id, isActive: true }, { $set: { endsAt } }, { session });
            }
            else {
                await Boost.create([{
                        entityId: ad._id,
                        entityType: 'ad',
                        boostType: type,
                        startsAt,
                        endsAt,
                        isActive: true
                    }], { session });
            }
            ad.isSpotlight = true;
            ad.spotlightExpiresAt = endsAt;
            await ad.save({ session });
        });
        setImmediate(() => {
            (0, redisCache_1.invalidateAdFeedCaches)().catch((err) => {
                logger_1.default.error('Failed to clear homepage cache after promotion', { error: String(err) });
            });
        });
    }
    finally {
        await session.endSession();
    }
    return ad;
};
exports.promoteAdLogic = promoteAdLogic;
//# sourceMappingURL=AdPromotionService.js.map