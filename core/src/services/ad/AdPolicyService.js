"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSellerTypeThreshold = exports.assertOwnership = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("@core/utils/AppError");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const User_1 = __importDefault(require("@core/models/User"));
const adStatus_1 = require("@core/constants/enums/adStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const SystemConfigService_1 = require("../SystemConfigService");
const logger_1 = __importDefault(require("@core/utils/logger"));
const assertOwnership = async (adId, userId) => {
    const ad = await Ad_1.default.findById(adId).select('sellerId status').lean();
    if (!ad) {
        throw new AppError_1.AppError('Ad not found', 404, 'NOT_FOUND');
    }
    if (String(ad.sellerId) !== String(userId)) {
        throw new AppError_1.AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }
    return ad;
};
exports.assertOwnership = assertOwnership;
/**
 * Validates if a seller is within their allowed listing threshold for a specific type.
 * Specifically used to enforce Business Account requirement for high-volume Spare Part sellers.
 */
const validateSellerTypeThreshold = async (sellerId, listingType) => {
    // Currently policy only applies to Spare Parts
    if (listingType !== listingType_1.LISTING_TYPE.SPARE_PART) {
        return { ok: true };
    }
    try {
        const user = await User_1.default.findById(sellerId).select('role').lean();
        if (!user)
            return { ok: false, reason: 'Seller not found', code: 'SELLER_NOT_FOUND' };
        // Business accounts have no threshold limits on spare parts
        if (user.role === 'business' ||
            user.role === 'admin' ||
            user.role === 'super_admin' ||
            user.role === 'superadmin') {
            return { ok: true };
        }
        const config = await (0, SystemConfigService_1.getSystemConfigForRead)();
        const threshold = config?.listing?.thresholds?.proSparePartLimit ?? 5; // Default 5
        const activeCount = await Ad_1.default.countDocuments({
            sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
            listingType: listingType_1.LISTING_TYPE.SPARE_PART,
            status: { $in: [adStatus_1.AD_STATUS.LIVE, 'pending'] },
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
    }
    catch (error) {
        logger_1.default.error('validateSellerTypeThreshold: Error during validation', { error, sellerId });
        return { ok: true }; // Fail open for safety
    }
};
exports.validateSellerTypeThreshold = validateSellerTypeThreshold;
//# sourceMappingURL=AdPolicyService.js.map