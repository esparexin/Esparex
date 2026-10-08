import { getStatusMatchCriteria } from './statusQueryMapper';

/**
 * ownerTabFilter.ts — owner ("my listings") tab filter SSOT companion.
 *
 * Lives next to FeedVisibilityGuard (the visibility rule owner) so neither
 * the guard nor controllers grow beyond ratchet. Controllers add
 * sellerId/isDeleted scoping around the returned fragment.
 */

/**
 * buildOwnerTabFilter — canonical SSOT for owner tab filters.
 * Owner-scoped queries must use this instead of hand-rolling
 * status/expiry combinations, so alias and expiry semantics stay in one place.
 */
export const buildOwnerTabFilter = (
    tab: string | null | undefined,
    now = new Date()
): Record<string, unknown> => {
    const tabStr = typeof tab === 'string' ? tab.trim().toLowerCase() : '';

    if (tabStr === 'live' || tabStr === 'active') {
        const liveCriteria = getStatusMatchCriteria('live');
        const liveStatuses =
            typeof liveCriteria === 'object' && '$in' in liveCriteria && Array.isArray(liveCriteria.$in)
                ? liveCriteria.$in
                : ['live', 'approved', 'active', 'published'];

        // Live/active ads must not have passed expiresAt.
        // Deactivated ads are explicitly exempt — they carry no expiry semantics.
        return {
            $and: [
                { status: { $in: [...liveStatuses, 'deactivated'] } },
                {
                    $or: [
                        { status: 'deactivated' },
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: now } },
                    ],
                },
            ],
        };
    }

    if (tabStr === 'pending') {
        return { status: 'pending' };
    }

    if (tabStr === 'expired') {
        return {
            $or: [
                { status: { $in: ['expired', 'sold'] } },
                {
                    status: getStatusMatchCriteria('live'),
                    expiresAt: { $lte: now },
                },
            ],
        };
    }

    return { status: { $in: [] } };
};
