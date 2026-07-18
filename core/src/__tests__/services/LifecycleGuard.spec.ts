import { LISTING_STATUS } from '@esparex/contracts';
import {
    isValidLifecycleTransition,
    validateTransition
} from '../../services/lifecycle/LifecycleGuard';

describe('LifecycleGuard', () => {
    it('allows only the approved transitions', () => {
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.PENDING, LISTING_STATUS.LIVE)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.PENDING, LISTING_STATUS.REJECTED)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.PENDING, LISTING_STATUS.DEACTIVATED)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.LIVE, LISTING_STATUS.PENDING)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.LIVE, LISTING_STATUS.REJECTED)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.LIVE, LISTING_STATUS.SOLD)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.LIVE, LISTING_STATUS.EXPIRED)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.LIVE, LISTING_STATUS.DEACTIVATED)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.REJECTED, LISTING_STATUS.PENDING)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.EXPIRED, LISTING_STATUS.PENDING)).toBe(true);
        // EXPIRED → SOLD: intentional — sellers can retrospectively mark expired listings as sold
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.EXPIRED, LISTING_STATUS.SOLD)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.DEACTIVATED, LISTING_STATUS.PENDING)).toBe(true);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.DEACTIVATED, LISTING_STATUS.LIVE)).toBe(true);
    });

    it('rejects illegal transitions', () => {
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.PENDING, LISTING_STATUS.SOLD)).toBe(false);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.PENDING, 'banned')).toBe(false);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.LIVE, LISTING_STATUS.LIVE)).toBe(false);
        expect(isValidLifecycleTransition('ad', LISTING_STATUS.SOLD, LISTING_STATUS.LIVE)).toBe(false);
    });

    it('throws for invalid transitions', () => {
        expect(() => validateTransition('ad', LISTING_STATUS.PENDING, LISTING_STATUS.SOLD)).toThrow(
            'Invalid lifecycle transition in ad domain: pending → sold'
        );
    });

    describe('service domain', () => {
        it('allows standard transitions', () => {
            expect(isValidLifecycleTransition('service', 'pending', 'live')).toBe(true);
            expect(isValidLifecycleTransition('service', 'pending', 'rejected')).toBe(true);
            expect(isValidLifecycleTransition('service', 'live', 'sold')).toBe(true);
            expect(isValidLifecycleTransition('service', 'live', 'expired')).toBe(true);
            expect(isValidLifecycleTransition('service', 'live', 'deactivated')).toBe(true);
            expect(isValidLifecycleTransition('service', 'rejected', 'pending')).toBe(true);
            expect(isValidLifecycleTransition('service', 'deactivated', 'live')).toBe(true);
        });

        it('allows EXPIRED → PENDING for seller repost', () => {
            expect(isValidLifecycleTransition('service', 'expired', 'pending')).toBe(true);
        });

        it('rejects invalid service transitions', () => {
            expect(isValidLifecycleTransition('service', 'pending', 'sold')).toBe(false);
            expect(isValidLifecycleTransition('service', 'sold', 'live')).toBe(false);
            expect(isValidLifecycleTransition('service', 'sold', 'pending')).toBe(false);
        });
    });

    describe('spare_part_listing domain', () => {
        it('allows standard transitions', () => {
            expect(isValidLifecycleTransition('spare_part_listing', 'pending', 'live')).toBe(true);
            expect(isValidLifecycleTransition('spare_part_listing', 'live', 'sold')).toBe(true);
            expect(isValidLifecycleTransition('spare_part_listing', 'live', 'deactivated')).toBe(true);
            expect(isValidLifecycleTransition('spare_part_listing', 'rejected', 'pending')).toBe(true);
            expect(isValidLifecycleTransition('spare_part_listing', 'deactivated', 'live')).toBe(true);
        });

        it('allows EXPIRED → PENDING for seller repost', () => {
            expect(isValidLifecycleTransition('spare_part_listing', 'expired', 'pending')).toBe(true);
        });

        it('disallows transitions from SOLD', () => {
            expect(isValidLifecycleTransition('spare_part_listing', 'sold', 'live')).toBe(false);
            expect(isValidLifecycleTransition('spare_part_listing', 'sold', 'pending')).toBe(false);
        });
    });
});
