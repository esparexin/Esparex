import { AD_STATUS } from '../../../../shared/enums/adStatus';
import {
    isValidLifecycleTransition,
    validateTransition
} from '../../services/LifecycleGuard';

describe('LifecycleGuard', () => {
    it('allows only the approved transitions', () => {
        expect(isValidLifecycleTransition('ad', AD_STATUS.PENDING, AD_STATUS.LIVE)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.PENDING, AD_STATUS.REJECTED)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.PENDING, AD_STATUS.DEACTIVATED)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.LIVE, AD_STATUS.PENDING)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.LIVE, AD_STATUS.REJECTED)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.LIVE, AD_STATUS.SOLD)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.LIVE, AD_STATUS.EXPIRED)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.LIVE, AD_STATUS.DEACTIVATED)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.REJECTED, AD_STATUS.PENDING)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.EXPIRED, AD_STATUS.PENDING)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.DEACTIVATED, AD_STATUS.PENDING)).toBe(true);
        expect(isValidLifecycleTransition('ad', AD_STATUS.DEACTIVATED, AD_STATUS.LIVE)).toBe(true);
    });

    it('rejects illegal transitions', () => {
        expect(isValidLifecycleTransition('ad', AD_STATUS.PENDING, AD_STATUS.SOLD)).toBe(false);
        expect(isValidLifecycleTransition('ad', AD_STATUS.EXPIRED, AD_STATUS.SOLD)).toBe(false);
        expect(isValidLifecycleTransition('ad', AD_STATUS.PENDING, 'banned')).toBe(false);
        expect(isValidLifecycleTransition('ad', AD_STATUS.LIVE, AD_STATUS.LIVE)).toBe(false);
        expect(isValidLifecycleTransition('ad', AD_STATUS.SOLD, AD_STATUS.LIVE)).toBe(false);
    });

    it('throws for invalid transitions', () => {
        expect(() => validateTransition('ad', AD_STATUS.PENDING, AD_STATUS.SOLD)).toThrow(
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
