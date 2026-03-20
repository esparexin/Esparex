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

    // Terminal status check logic moved to shared enums or specific service helpers if needed
    // isTerminalLifecycleStatus was removed from LifecycleGuard

    it('throws for invalid transitions', () => {
        expect(() => validateTransition('ad', AD_STATUS.PENDING, AD_STATUS.SOLD)).toThrow(
            'Invalid lifecycle transition in ad domain: pending → sold'
        );
    });
});
