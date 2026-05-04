"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionPolicyService = void 0;
const listingType_1 = require("@core/constants/enums/listingType");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
/**
 * PromotionPolicyService
 * Centralized SSOT for all listing promotion logic.
 * Decides which listing types can be promoted and under what conditions.
 */
class PromotionPolicyService {
    /**
     * Determine if a listing is eligible for promotion (Spotlight/Boost).
     *
     * @param listing The listing document or object (must contain listingType and status)
     */
    static canPromote(listing) {
        const type = listing.listingType;
        // 1. Basic Status Guard — Only LIVE listings can be promoted
        if (listing.status !== listingStatus_1.LISTING_STATUS.LIVE) {
            return {
                allowed: false,
                reason: 'Only live listings can be promoted.',
                code: 'PROMOTION_STATUS_INVALID'
            };
        }
        // 2. Type-Specific Policy
        switch (type) {
            case listingType_1.LISTING_TYPE.AD:
            case listingType_1.LISTING_TYPE.SERVICE:
                return { allowed: true };
            case listingType_1.LISTING_TYPE.SPARE_PART:
                return {
                    allowed: false,
                    reason: 'Spare parts cannot be spotlight-promoted.',
                    code: 'PROMOTION_TYPE_NOT_SUPPORTED'
                };
            default:
                return {
                    allowed: false,
                    reason: `Unsupported listing type for promotion: ${type}`,
                    code: 'PROMOTION_TYPE_UNKNOWN'
                };
        }
    }
    /**
     * Returns a list of all types that are eligible for promotion.
     * Useful for UI filtering or business logic checks.
     */
    static getEligibleTypes() {
        return [listingType_1.LISTING_TYPE.AD, listingType_1.LISTING_TYPE.SERVICE];
    }
}
exports.PromotionPolicyService = PromotionPolicyService;
//# sourceMappingURL=PromotionPolicyService.js.map