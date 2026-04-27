"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateTrustScore = void 0;
const User_1 = __importDefault(require("@core/models/User"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const Business_1 = __importDefault(require("@core/models/Business"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const adStatus_1 = require("@core/constants/enums/adStatus");
const businessStatus_1 = require("@core/constants/enums/businessStatus");
/**
 * 🏆 OFFICIAL TRUST SCORE ENGINE (V1)
 * Calculates a dynamic 0-100 seller reputation score based on strict SSOT rules.
 * This score directly affects search ranking, geo-scoring, and spotlight eligibility.
 */
const recalculateTrustScore = async (userId) => {
    try {
        const [user, business] = await Promise.all([
            User_1.default.findById(userId).select('createdAt isVerified strikeCount trustScore'),
            Business_1.default.findOne({ userId }).select('status')
        ]);
        if (!user)
            return;
        let score = 50; // Neutral Baseline (New User)
        // 1. Account Age Bonus (max +15)
        const daysActive = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const ageBonus = Math.min(Math.floor(daysActive / 30), 15);
        score += ageBonus;
        // 2. Verification Bonus (+10)
        if (user.isVerified)
            score += 10;
        // 3. Business Verified Bonus (+10)
        if (business?.status === businessStatus_1.BUSINESS_STATUS.LIVE)
            score += 10;
        // 4. Strike Penalty (-15 per strike, max -45)
        const strikeCount = user.strikeCount || 0;
        const strikePenalty = Math.min(strikeCount * 15, 45);
        score -= strikePenalty;
        // 5. Fetch Ad History for Behavioral Metrics
        const ads = await Ad_1.default.find({ sellerId: user._id }).select('status soldReason moderationStatus fraudScore');
        let soldOnPlatformCount = 0;
        let rejectedCount = 0;
        let maxFraudScore = 0;
        const totalAds = ads.length;
        for (const ad of ads) {
            // Check for valid sales to avoid gaming metrics
            if (ad.soldReason === 'sold_on_platform')
                soldOnPlatformCount++;
            // Check for policy violations (rejection history)
            if (ad.moderationStatus === 'rejected')
                rejectedCount++;
            // Track highest fraud risk event
            if (ad.fraudScore && ad.fraudScore > maxFraudScore)
                maxFraudScore = ad.fraudScore;
        }
        // 5a. Successful Sales Bonus (+2 per sale, max +20)
        const salesBonus = Math.min(soldOnPlatformCount * 2, 20);
        score += salesBonus;
        // 5b. Rejection Ratio Penalty (max -15)
        if (totalAds > 0 && rejectedCount > 0) {
            const rejectionRatio = rejectedCount / totalAds;
            const rejectionPenalty = Math.min(Math.floor(rejectionRatio * 15), 15);
            score -= rejectionPenalty;
        }
        // 5c. Fraud Score Penalty (If max fraud > 50)
        if (maxFraudScore > 50) {
            const fraudPenalty = Math.floor((maxFraudScore - 50) / 2);
            score -= fraudPenalty;
        }
        // 6. Clamp Final Score: 0 - 100
        const finalScore = Math.max(0, Math.min(score, 100));
        // 7. Update User if Changed
        if (user.trustScore !== finalScore) {
            user.trustScore = finalScore;
            await user.save();
            logger_1.default.info(`Score Engine: User ${String(userId)} trust score recalculated -> [${finalScore}]`);
            // 8. 🚀 Synchronize Snapshot to Ad Collection for Pre-calculated Search Performance
            await Ad_1.default.updateMany({ sellerId: user._id, status: adStatus_1.AD_STATUS.LIVE }, { $set: { sellerTrustSnapshot: finalScore } });
            logger_1.default.info(`Score Engine: Synced trust snapshot [${finalScore}] to active ads for User ${String(userId)}`);
        }
    }
    catch (error) {
        logger_1.default.error(`Error calculating trust score for user ${String(userId)}`, { error: error instanceof Error ? error.message : String(error) });
    }
};
exports.recalculateTrustScore = recalculateTrustScore;
//# sourceMappingURL=TrustService.js.map