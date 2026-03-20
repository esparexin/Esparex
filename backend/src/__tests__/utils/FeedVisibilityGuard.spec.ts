import {
    buildPublicAdFilter,
    assertFeedSafetyFilter,
    HIDDEN_MODERATION_STATUSES
} from '../../utils/FeedVisibilityGuard';

describe('FeedVisibilityGuard', () => {
    describe('HIDDEN_MODERATION_STATUSES', () => {
        it('contains rejected and community_hidden', () => {
            expect(HIDDEN_MODERATION_STATUSES).toContain('rejected');
            expect(HIDDEN_MODERATION_STATUSES).toContain('community_hidden');
        });
    });

    describe('buildPublicAdFilter', () => {
        it('returns filter with status live', () => {
            const filter = buildPublicAdFilter();
            expect(filter.status).toBe('live');
        });

        it('returns filter with isDeleted exclusion', () => {
            const filter = buildPublicAdFilter();
            expect(filter.isDeleted).toEqual({ $ne: true });
        });

        it('returns filter with expiresAt in the future', () => {
            const before = new Date();
            const filter = buildPublicAdFilter();
            expect(filter.expiresAt.$gt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        });

        it('returns filter with moderationStatus $nin excluding hidden statuses', () => {
            const filter = buildPublicAdFilter();
            expect(filter.moderationStatus).toBeDefined();
            expect(filter.moderationStatus.$nin).toContain('rejected');
            expect(filter.moderationStatus.$nin).toContain('community_hidden');
        });

        it('does not include any unknown properties', () => {
            const filter = buildPublicAdFilter();
            const keys = Object.keys(filter).sort();
            expect(keys).toEqual(['expiresAt', 'isDeleted', 'moderationStatus', 'status']);
        });
    });

    describe('assertFeedSafetyFilter', () => {
        it('passes for a valid filter from buildPublicAdFilter', () => {
            const filter = buildPublicAdFilter();
            expect(() => assertFeedSafetyFilter(filter)).not.toThrow();
        });

        it('throws for a filter missing moderationStatus', () => {
            const badFilter = { status: 'live', isDeleted: { $ne: true } };
            expect(() => assertFeedSafetyFilter(badFilter)).toThrow(
                '[FeedVisibilityGuard] CRITICAL'
            );
        });

        it('throws for a filter with moderationStatus as a plain string', () => {
            const badFilter = { status: 'live', moderationStatus: 'live' };
            expect(() => assertFeedSafetyFilter(badFilter)).toThrow(
                '[FeedVisibilityGuard] CRITICAL'
            );
        });

        it('passes for a filter with moderationStatus as an object', () => {
            const okFilter = { moderationStatus: { $ne: 'rejected' } };
            expect(() => assertFeedSafetyFilter(okFilter)).not.toThrow();
        });
    });
});
