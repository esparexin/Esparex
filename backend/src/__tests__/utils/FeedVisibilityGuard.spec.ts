import {
    buildPublicAdFilter,
    assertFeedSafetyFilter,
    HIDDEN_MODERATION_STATUSES,
    isPublicAdVisible,
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
            expect(filter.status).toEqual({ $in: ['live', 'approved', 'active', 'published'] });
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

    describe('isPublicAdVisible', () => {
        it('returns true for a live, non-deleted, non-hidden ad with future expiry', () => {
            expect(
                isPublicAdVisible({
                    status: 'live',
                    isDeleted: false,
                    expiresAt: new Date(Date.now() + 60_000),
                    moderationStatus: 'approved',
                })
            ).toBe(true);
        });

        it('returns false for non-live statuses', () => {
            expect(
                isPublicAdVisible({
                    status: 'pending',
                    isDeleted: false,
                    expiresAt: new Date(Date.now() + 60_000),
                })
            ).toBe(false);
        });

        it('returns false for hidden moderation statuses', () => {
            expect(
                isPublicAdVisible({
                    status: 'live',
                    isDeleted: false,
                    expiresAt: new Date(Date.now() + 60_000),
                    moderationStatus: 'held_for_review',
                })
            ).toBe(false);
        });

        it('returns false for expired listings', () => {
            expect(
                isPublicAdVisible({
                    status: 'live',
                    isDeleted: false,
                    expiresAt: new Date(Date.now() - 60_000),
                })
            ).toBe(false);
        });
    });
});
