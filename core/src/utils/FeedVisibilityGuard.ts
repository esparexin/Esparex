import { HIDDEN_MODERATION_STATUSES as GUARD_HIDDEN, buildPublicVisibilityFilter } from '../services/lifecycle/LifecycleGuard';

export const HIDDEN_MODERATION_STATUSES = GUARD_HIDDEN;

export const buildPublicAdFilter = () => {
    return buildPublicVisibilityFilter();
};

const LIVE_STATUS_ALIASES = new Set(['live', 'approved', 'active', 'published']);

type PublicAdVisibilityRecord = {
    status?: unknown;
    isDeleted?: unknown;
    expiresAt?: unknown;
    moderationStatus?: unknown;
};

function toDateOrNull(value: unknown): Date | null {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

export const isPublicAdVisible = (
    ad: PublicAdVisibilityRecord | null | undefined,
    now = new Date()
): boolean => {
    if (!ad) return false;

    const normalizedStatus = typeof ad.status === 'string' ? ad.status.trim().toLowerCase() : '';
    if (!LIVE_STATUS_ALIASES.has(normalizedStatus)) {
        return false;
    }

    if (ad.isDeleted === true) {
        return false;
    }

    const expiresAt = toDateOrNull(ad.expiresAt);
    if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
        return false;
    }

    const moderationStatus = typeof ad.moderationStatus === 'string'
        ? ad.moderationStatus.trim().toLowerCase()
        : '';

    if (moderationStatus && HIDDEN_MODERATION_STATUSES.includes(moderationStatus as typeof HIDDEN_MODERATION_STATUSES[number])) {
        return false;
    }

    return true;
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
