import { canTransitionAdStatus, canTransitionBusinessStatus } from '@esparex/shared';
import { LISTING_STATUS, BUSINESS_STATUS } from '@esparex/contracts';

describe('State Machine Transition Governance (SSOT)', () => {
    describe('Ad / Listing Status Transitions', () => {
        it('should allow valid transitions for Ad lifecycle', () => {
            expect(canTransitionAdStatus(LISTING_STATUS.DRAFT, LISTING_STATUS.PENDING)).toBe(true);
            expect(canTransitionAdStatus(LISTING_STATUS.PENDING, LISTING_STATUS.LIVE)).toBe(true);
            expect(canTransitionAdStatus(LISTING_STATUS.PENDING, LISTING_STATUS.REJECTED)).toBe(true);
            expect(canTransitionAdStatus(LISTING_STATUS.LIVE, LISTING_STATUS.SOLD)).toBe(true);
            expect(canTransitionAdStatus(LISTING_STATUS.LIVE, LISTING_STATUS.DEACTIVATED)).toBe(true);
            expect(canTransitionAdStatus(LISTING_STATUS.LIVE, LISTING_STATUS.EXPIRED)).toBe(true);
            expect(canTransitionAdStatus(LISTING_STATUS.EXPIRED, LISTING_STATUS.LIVE)).toBe(true);
        });

        it('should reject illegal transitions for Ad lifecycle', () => {
            expect(canTransitionAdStatus(LISTING_STATUS.DRAFT, LISTING_STATUS.SOLD)).toBe(false);
            expect(canTransitionAdStatus(LISTING_STATUS.REJECTED, LISTING_STATUS.SOLD)).toBe(false);
            expect(canTransitionAdStatus(LISTING_STATUS.EXPIRED, LISTING_STATUS.PENDING)).toBe(false);
        });

        it('should allow self-transition (identity)', () => {
            expect(canTransitionAdStatus(LISTING_STATUS.LIVE, LISTING_STATUS.LIVE)).toBe(true);
            expect(canTransitionAdStatus(LISTING_STATUS.PENDING, LISTING_STATUS.PENDING)).toBe(true);
        });
    });

    describe('Business Profile Status Transitions', () => {
        it('should allow valid transitions for Business lifecycle', () => {
            expect(canTransitionBusinessStatus(BUSINESS_STATUS.PENDING, BUSINESS_STATUS.LIVE)).toBe(true);
            expect(canTransitionBusinessStatus(BUSINESS_STATUS.PENDING, BUSINESS_STATUS.REJECTED)).toBe(true);
            expect(canTransitionBusinessStatus(BUSINESS_STATUS.LIVE, BUSINESS_STATUS.DEACTIVATED)).toBe(true);
            expect(canTransitionBusinessStatus(BUSINESS_STATUS.LIVE, BUSINESS_STATUS.SUSPENDED)).toBe(true);
            expect(canTransitionBusinessStatus(BUSINESS_STATUS.LIVE, BUSINESS_STATUS.CLOSED)).toBe(true);
        });

        it('should reject illegal transitions for Business lifecycle', () => {
            expect(canTransitionBusinessStatus(BUSINESS_STATUS.REJECTED, BUSINESS_STATUS.LIVE)).toBe(false);
            expect(canTransitionBusinessStatus(BUSINESS_STATUS.CLOSED, BUSINESS_STATUS.LIVE)).toBe(false);
        });
    });
});
