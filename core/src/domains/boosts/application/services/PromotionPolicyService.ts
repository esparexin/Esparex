import { LISTING_TYPE, type ListingTypeValue } from '@esparex/contracts';
import { LISTING_STATUS } from '@esparex/contracts';

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
        if (listing.status !== LISTING_STATUS.LIVE) {
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
                    reason: `Unsupported listing type for promotion: ${type as string}`,
                    code: 'PROMOTION_TYPE_UNKNOWN'
                };
        }
    }

    /**
     * Validate full promotion eligibility including active tier hierarchy:
     * Hierarchy: Normal Ad (0) -> Top Ad (1) -> Spotlight (2)
     * - Active Spotlight cannot purchase Spotlight or Top Ad until expired.
     * - Active Top Ad can upgrade to Spotlight, but cannot repurchase Top Ad until expired.
     */
    static validatePromotionEligibility(params: {
        listingType: string;
        status: string;
        isSpotlight?: boolean;
        spotlightExpiresAt?: Date | string | null;
        isBoosted?: boolean;
        boostExpiresAt?: Date | string | null;
        requestedType: string;
    }): PromotionPolicyResult {
        const canPromoteResult = this.canPromote({ listingType: params.listingType, status: params.status });
        if (!canPromoteResult.allowed) return canPromoteResult;

        const now = new Date();
        const hasActiveSpotlight = Boolean(
            params.isSpotlight &&
            params.spotlightExpiresAt &&
            new Date(String(params.spotlightExpiresAt)).getTime() > now.getTime()
        );

        const hasActiveTopAd = Boolean(
            params.isBoosted &&
            params.boostExpiresAt &&
            new Date(String(params.boostExpiresAt)).getTime() > now.getTime()
        );

        const isTopAdRequest = params.requestedType === 'push_to_top' || params.requestedType === 'boost';

        // Hierarchy Rule 1: Active Spotlight cannot purchase either Spotlight or Top Ad until expired
        if (hasActiveSpotlight) {
            return {
                allowed: false,
                reason: 'This listing already has an active Spotlight promotion. Spotlight is the highest tier and cannot be repurchased until it expires.',
                code: 'ACTIVE_SPOTLIGHT_EXISTS'
            };
        }

        // Hierarchy Rule 2: Active Top Ad cannot repurchase Top Ad (must upgrade to Spotlight or wait for expiry)
        if (hasActiveTopAd && isTopAdRequest) {
            return {
                allowed: false,
                reason: 'This listing already has an active Top Ad promotion. You can upgrade to Spotlight or wait for the Top Ad to expire.',
                code: 'ACTIVE_TOP_AD_EXISTS'
            };
        }

        // Top Ad -> Spotlight upgrade is ALLOWED
        return { allowed: true };
    }

    /**
     * Validate whether the user has sufficient available credits before applying a promotion.
     */
    static validatePromotionCredits(params: {
        requestedType: string;
        availableSpotlightCredits: number;
        availableBoostCredits: number;
    }): PromotionPolicyResult {
        const isSpotlight = params.requestedType === 'spotlight_hp' || params.requestedType === 'spotlight_cat' || params.requestedType === 'spotlight';
        const isTopAd = params.requestedType === 'push_to_top' || params.requestedType === 'boost';

        if (isSpotlight && params.availableSpotlightCredits <= 0) {
            return {
                allowed: false,
                reason: 'Insufficient Spotlight credits. Please purchase a Spotlight ad pack first.',
                code: 'INSUFFICIENT_SPOTLIGHT_CREDITS'
            };
        }

        if (isTopAd && params.availableBoostCredits <= 0) {
            return {
                allowed: false,
                reason: 'Insufficient Top Ad credits. Please purchase a Top Ad pack first.',
                code: 'INSUFFICIENT_TOP_AD_CREDITS'
            };
        }

        return { allowed: true };
    }

    /**
     * Returns a list of all types that are eligible for promotion.
     * Useful for UI filtering or business logic checks.
     */
    static getEligibleTypes(): ListingTypeValue[] {
        return [LISTING_TYPE.AD, LISTING_TYPE.SERVICE];
    }
}
