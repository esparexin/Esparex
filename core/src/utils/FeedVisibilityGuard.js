"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertFeedSafetyFilter = exports.isPublicAdVisible = exports.buildPublicAdFilter = exports.HIDDEN_MODERATION_STATUSES = void 0;
const adStatus_1 = require("@core/constants/enums/adStatus");
const statusQueryMapper_1 = require("./statusQueryMapper");
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
exports.HIDDEN_MODERATION_STATUSES = ['rejected', 'community_hidden', 'held_for_review'];
const buildPublicAdFilter = () => {
    // Runtime safety check to prevent accidental status bypass
    if (adStatus_1.AD_STATUS.LIVE !== 'live') {
        throw new Error('[FeedVisibilityGuard] CRITICAL: AD_STATUS.LIVE is corrupted or improperly defined.');
    }
    return {
        status: (0, statusQueryMapper_1.getStatusMatchCriteria)(adStatus_1.AD_STATUS.LIVE),
        isDeleted: { $ne: true },
        expiresAt: { $gt: new Date() },
        moderationStatus: { $nin: [...exports.HIDDEN_MODERATION_STATUSES] }
    };
};
exports.buildPublicAdFilter = buildPublicAdFilter;
const LIVE_STATUS_ALIASES = new Set(['live', 'approved', 'active', 'published']);
function toDateOrNull(value) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}
const isPublicAdVisible = (ad, now = new Date()) => {
    if (!ad)
        return false;
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
    if (moderationStatus && exports.HIDDEN_MODERATION_STATUSES.includes(moderationStatus)) {
        return false;
    }
    return true;
};
exports.isPublicAdVisible = isPublicAdVisible;
/**
 * Runtime assertion: verifies a query filter object includes the moderationStatus
 * exclusion. Call this defensively in any controller that builds custom feed queries
 * to prevent accidental visibility leaks.
 *
 * @throws Error if the filter is missing moderationStatus protection.
 */
const assertFeedSafetyFilter = (filter) => {
    const mod = filter.moderationStatus;
    if (!mod || typeof mod !== 'object') {
        throw new Error('[FeedVisibilityGuard] CRITICAL: Feed query is missing moderationStatus filter. ' +
            'Use buildPublicAdFilter() to construct safe feed queries.');
    }
};
exports.assertFeedSafetyFilter = assertFeedSafetyFilter;
//# sourceMappingURL=FeedVisibilityGuard.js.map