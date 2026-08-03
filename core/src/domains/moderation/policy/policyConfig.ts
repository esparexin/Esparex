/**
 * Marketplace Moderation Policy Configuration Thresholds
 */
export interface MarketplacePolicyThresholds {
    adultRejectThreshold: number; // e.g. 0.75 -> REJECT
    adultReviewThreshold: number; // e.g. 0.30 -> HELD_FOR_REVIEW
    violenceRejectThreshold: number; // e.g. 0.70 -> REJECT
    violenceReviewThreshold: number; // e.g. 0.25 -> HELD_FOR_REVIEW
    racyReviewThreshold: number; // e.g. 0.50 -> HELD_FOR_REVIEW
}

export const DEFAULT_MARKETPLACE_POLICY_THRESHOLDS: MarketplacePolicyThresholds = {
    adultRejectThreshold: 0.75,
    adultReviewThreshold: 0.30,
    violenceRejectThreshold: 0.70,
    violenceReviewThreshold: 0.25,
    racyReviewThreshold: 0.50,
};
