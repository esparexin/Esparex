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
exports.getUserProfileById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("@core/models/User"));
const adStatus_1 = require("@core/constants/enums/adStatus");
const AdAggregationService = __importStar(require("./ad/AdAggregationService"));
const getUserProfileById = async (userId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return null;
    }
    const objectId = new mongoose_1.default.Types.ObjectId(userId);
    const seller = await User_1.default.findOne({
        _id: objectId,
        status: { $ne: 'deleted' }
    })
        .select('name avatar createdAt isVerified location.city location.state location.country')
        .lean();
    if (!seller) {
        return null;
    }
    const sellerAds = await AdAggregationService.getAds({
        sellerId: userId,
        status: adStatus_1.AD_STATUS.LIVE,
    }, { page: 1, limit: 20 }, {});
    const visibleAds = Array.isArray(sellerAds.data) ? sellerAds.data.slice(0, 20) : [];
    const totalActive = typeof sellerAds.pagination?.total === 'number'
        ? sellerAds.pagination.total
        : visibleAds.length;
    const normalizedUser = {
        id: seller._id.toHexString(),
        name: typeof seller.name === 'string' ? seller.name : undefined,
        profilePhoto: typeof seller.avatar === 'string' ? seller.avatar : undefined,
        createdAt: seller.createdAt ? seller.createdAt.toISOString() : undefined,
        isVerified: Boolean(seller.isVerified),
        location: seller.location
            ? {
                city: seller.location.city,
                state: seller.location.state,
                country: seller.location.country,
            }
            : undefined
    };
    return {
        user: normalizedUser,
        listingSummary: {
            totalActive,
            visibleCount: visibleAds.length,
            hasMore: totalActive > visibleAds.length,
        },
        ads: visibleAds
    };
};
exports.getUserProfileById = getUserProfileById;
//# sourceMappingURL=UserProfileService.js.map