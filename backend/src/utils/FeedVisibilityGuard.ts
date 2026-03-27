import { AD_STATUS } from '../../../shared/enums/adStatus';
import { getStatusMatchCriteria } from './statusQueryMapper';

/**
 * FeedVisibilityGuard
 * Enterprise SSOT for resolving whether a public viewer is legally allowed to see an Ad.
 * 
 * Rules:
 * - status MUST be 'live' equivalent (active, approved)
 * - expiresAt MUST be in the future
 * - isDeleted MUST be false
 * - moderationStatus MUST NOT be 'rejected' or 'community_hidden'
 * - Spotlight / Boost MUST NOT override this visibility boundary.
 *
 * ALL feed/search endpoints MUST use buildPublicAdFilter() — never inline filters.
 */

/**
 * Moderation statuses that hide an ad from public feeds.
 * 'rejected' = admin manual rejection.
 * 'community_hidden' = auto-hidden after ≥ N community reports.
 */
export const HIDDEN_MODERATION_STATUSES = ['rejected', 'community_hidden', 'held_for_review'] as const;

export const buildPublicAdFilter = () => {
    // Runtime safety check to prevent accidental status bypass
    if (AD_STATUS.LIVE !== 'live') {
        throw new Error('[FeedVisibilityGuard] CRITICAL: AD_STATUS.LIVE is corrupted or improperly defined.');
    }

    return {
        status: getStatusMatchCriteria(AD_STATUS.LIVE),
        isDeleted: { $ne: true },
        expiresAt: { $gt: new Date() },
        moderationStatus: { $nin: [...HIDDEN_MODERATION_STATUSES] }
    };
};

/**
 * Runtime assertion: verifies a query filter object includes the moderationStatus
 * exclusion. Call this defensively in any controller that builds custom feed queries
 * to prevent accidental visibility leaks.
 *
 * @throws Error if the filter is missing moderationStatus protection.
 */
export const assertFeedSafetyFilter = (filter: Record<string, unknown>): void => {
    const mod = filter.moderationStatus;
    if (!mod || typeof mod !== 'object') {
        throw new Error(
            '[FeedVisibilityGuard] CRITICAL: Feed query is missing moderationStatus filter. ' +
            'Use buildPublicAdFilter() to construct safe feed queries.'
        );
    }
};

