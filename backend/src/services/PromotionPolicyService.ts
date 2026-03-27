import { LISTING_TYPE, type ListingTypeValue } from '../../../shared/enums/listingType';
import { AD_STATUS } from '../../../shared/enums/adStatus';

export interface PromotionPolicyResult {
    allowed: boolean;
    reason?: string;
    code?: string;
}

/**
 * PromotionPolicyService
 * Centralized SSOT for all listing promotion logic.
 * Decides which listing types can be promoted and under what conditions.
 */
export class PromotionPolicyService {
    /**
     * Determine if a listing is eligible for promotion (Spotlight/Boost).
     * 
     * @param listing The listing document or object (must contain listingType and status)
     */
    static canPromote(listing: { listingType: string; status: string }): PromotionPolicyResult {
        const type = listing.listingType as ListingTypeValue;

        // 1. Basic Status Guard — Only LIVE listings can be promoted
        if (listing.status !== AD_STATUS.LIVE) {
            return {
                allowed: false,
                reason: 'Only live listings can be promoted.',
                code: 'PROMOTION_STATUS_INVALID'
            };
        }

        // 2. Type-Specific Policy
        switch (type) {
            case LISTING_TYPE.AD:
            case LISTING_TYPE.SERVICE:
                return { allowed: true };

            case LISTING_TYPE.SPARE_PART:
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
    static getEligibleTypes(): ListingTypeValue[] {
        return [LISTING_TYPE.AD, LISTING_TYPE.SERVICE];
    }
}
