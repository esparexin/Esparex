"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOwnedService = exports.extendListingExpiry = exports.repostAd = exports.promoteAd = exports.updateAdTransactional = exports.updateAd = exports.assertOwnership = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const db_1 = require("@core/config/db");
const StatusMutationService_1 = require("./StatusMutationService");
// Leaf Services
const AdUpdateService_1 = require("./ad/AdUpdateService");
const AdPromotionService_1 = require("./ad/AdPromotionService");
const AdRepostService_1 = require("./ad/AdRepostService");
const AdPolicyService_1 = require("./ad/AdPolicyService");
Object.defineProperty(exports, "assertOwnership", { enumerable: true, get: function () { return AdPolicyService_1.assertOwnership; } });
const redisCache_1 = require("@core/utils/redisCache");
const updateAd = async (adId, data, context, externalSession) => {
    const result = await (0, AdUpdateService_1.updateAdLogic)(adId, data, context, externalSession);
    if (result) {
        // 🛡️ STAFF+ CONSISTENCY GUARD
        // Bust both search and detail caches to prevent stale data visibility.
        void (0, redisCache_1.invalidateAdFeedCaches)().catch(() => { });
        void (0, redisCache_1.invalidatePublicAdCache)(adId).catch(() => { });
    }
    return result;
};
exports.updateAd = updateAd;
const updateAdTransactional = async (options) => {
    const { adId, patch, context, optionalStatusTransition } = options;
    const connection = (0, db_1.getUserConnection)();
    const session = await connection.startSession();
    try {
        let result = null;
        await session.withTransaction(async () => {
            if (Object.keys(patch).length > 0) {
                result = await (0, AdUpdateService_1.updateAdLogic)(adId, patch, context, session);
            }
            if (optionalStatusTransition) {
                result = await (0, StatusMutationService_1.mutateStatus)({
                    domain: 'ad',
                    entityId: adId,
                    toStatus: optionalStatusTransition.toStatus,
                    actor: { type: context.actor === 'ADMIN' ? 'admin' : 'user', id: context.authUserId, ip: '', userAgent: '' },
                    reason: optionalStatusTransition.reason,
                    session
                });
            }
        });
        return result;
    }
    finally {
        await session.endSession();
    }
};
exports.updateAdTransactional = updateAdTransactional;
const promoteAd = async (id, days = 7, type = 'spotlight_hp', userId, isAdmin = false) => {
    const result = await (0, AdPromotionService_1.promoteAdLogic)(id, days, type, userId, isAdmin);
    if (result) {
        void (0, redisCache_1.invalidateAdFeedCaches)().catch(() => { });
        void (0, redisCache_1.invalidatePublicAdCache)(id).catch(() => { });
    }
    return result;
};
exports.promoteAd = promoteAd;
const repostAd = async (id, userId) => {
    const result = await (0, AdRepostService_1.repostAdLogic)(id, userId);
    if (result) {
        void (0, redisCache_1.invalidateAdFeedCaches)().catch(() => { });
        void (0, redisCache_1.invalidatePublicAdCache)(id).catch(() => { });
    }
    return result;
};
exports.repostAd = repostAd;
const extendListingExpiry = async (id, expiresAt, currentStatus, now) => {
    return Ad_1.default.findByIdAndUpdate(id, {
        expiresAt,
        $push: {
            timeline: {
                status: currentStatus,
                timestamp: now,
                reason: 'Expiry extended by admin',
            },
        },
    }, { new: true });
};
exports.extendListingExpiry = extendListingExpiry;
const findOwnedService = async (id, userId, listingType, fetchFull) => {
    const objectId = new mongoose_1.default.Types.ObjectId(id);
    if (fetchFull) {
        return Ad_1.default.findOne({ _id: objectId, listingType: listingType, sellerId: userId });
    }
    return Ad_1.default.findOne({ _id: objectId, listingType: listingType, sellerId: userId, isDeleted: { $ne: true } }).select('status');
};
exports.findOwnedService = findOwnedService;
//# sourceMappingURL=AdMutationService.js.map