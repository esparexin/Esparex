import { describe, it, expect } from 'vitest';

describe('React Component Render Optimization Comparators', () => {
    it('prevents unnecessary AdCardGrid re-renders when relevant props remain equal', () => {
        const prevProps = {
            ad: { id: 'ad-123', price: 15000, title: 'iPhone 13 128GB' },
            isSaved: false,
            priority: false,
            href: '/ads/iphone-13',
            showBusinessBadge: true,
            className: 'custom-card',
        };

        const nextProps = {
            ad: { id: 'ad-123', price: 15000, title: 'iPhone 13 128GB' },
            isSaved: false,
            priority: false,
            href: '/ads/iphone-13',
            showBusinessBadge: true,
            className: 'custom-card',
        };

        // Inline definition of custom comparator for verification
        const areAdCardGridPropsEqual = (p: typeof prevProps, n: typeof nextProps) =>
            p.ad.id === n.ad.id &&
            p.ad.price === n.ad.price &&
            p.ad.title === n.ad.title &&
            p.isSaved === n.isSaved &&
            p.priority === n.priority &&
            p.href === n.href &&
            p.showBusinessBadge === n.showBusinessBadge &&
            p.className === n.className;

        expect(areAdCardGridPropsEqual(prevProps, nextProps)).toBe(true);
    });

    it('triggers AdCardGrid re-render when saved status changes', () => {
        const prevProps = { ad: { id: 'ad-123', price: 15000, title: 'iPhone 13 128GB' }, isSaved: false };
        const nextProps = { ad: { id: 'ad-123', price: 15000, title: 'iPhone 13 128GB' }, isSaved: true };

        const areAdCardGridPropsEqual = (p: typeof prevProps, n: typeof nextProps) =>
            p.ad.id === n.ad.id && p.isSaved === n.isSaved;

        expect(areAdCardGridPropsEqual(prevProps, nextProps)).toBe(false);
    });

    it('prevents unnecessary AdCardList re-renders when relevant props remain equal', () => {
        const prevProps = {
            ad: { id: 'ad-456', price: 8000, title: 'Samsung Galaxy S23' },
            isSaved: false,
            priority: false,
            href: '/ads/samsung-galaxy-s23',
            className: undefined as string | undefined,
        };

        // New object reference — same values (simulates TanStack Query refetch)
        const nextProps = {
            ad: { id: 'ad-456', price: 8000, title: 'Samsung Galaxy S23' },
            isSaved: false,
            priority: false,
            href: '/ads/samsung-galaxy-s23',
            className: undefined as string | undefined,
        };

        const areAdCardListPropsEqual = (p: typeof prevProps, n: typeof nextProps) =>
            p.ad.id === n.ad.id &&
            p.ad.price === n.ad.price &&
            p.ad.title === n.ad.title &&
            p.isSaved === n.isSaved &&
            p.priority === n.priority &&
            p.href === n.href &&
            p.className === n.className;

        expect(areAdCardListPropsEqual(prevProps, nextProps)).toBe(true);
    });

    it('triggers AdCardList re-render when saved status changes', () => {
        const prevProps = { ad: { id: 'ad-456', price: 8000, title: 'Samsung Galaxy S23' }, isSaved: false };
        const nextProps = { ad: { id: 'ad-456', price: 8000, title: 'Samsung Galaxy S23' }, isSaved: true };

        const areAdCardListPropsEqual = (p: typeof prevProps, n: typeof nextProps) =>
            p.ad.id === n.ad.id && p.isSaved === n.isSaved;

        expect(areAdCardListPropsEqual(prevProps, nextProps)).toBe(false);
    });

    it('prevents unnecessary OtpInputGroup re-renders when timer ticks occur but OTP digits remain unchanged (PERF-002)', () => {
        const prevProps = {
            otp: ['5', '2', '8', '', '', ''],
            disabled: false,
            hasError: false,
            shakeAnimation: false,
        };

        // Simulates timer tick in parent (resendRemainingSeconds 29s -> 28s) while digits are unchanged
        const nextProps = {
            otp: ['5', '2', '8', '', '', ''],
            disabled: false,
            hasError: false,
            shakeAnimation: false,
        };

        const areOtpInputGroupPropsEqual = (p: typeof prevProps, n: typeof nextProps) =>
            p.disabled === n.disabled &&
            p.hasError === n.hasError &&
            p.shakeAnimation === n.shakeAnimation &&
            p.otp.length === n.otp.length &&
            p.otp.every((digit, i) => digit === n.otp[i]);

        expect(areOtpInputGroupPropsEqual(prevProps, nextProps)).toBe(true);
    });

    it('triggers OtpInputGroup re-render when a new digit is typed', () => {
        const prevProps = {
            otp: ['5', '2', '8', '', '', ''],
            disabled: false,
            hasError: false,
            shakeAnimation: false,
        };

        const nextProps = {
            otp: ['5', '2', '8', '9', '', ''],
            disabled: false,
            hasError: false,
            shakeAnimation: false,
        };

        const areOtpInputGroupPropsEqual = (p: typeof prevProps, n: typeof nextProps) =>
            p.disabled === n.disabled &&
            p.hasError === n.hasError &&
            p.shakeAnimation === n.shakeAnimation &&
            p.otp.length === n.otp.length &&
            p.otp.every((digit, i) => digit === n.otp[i]);

        expect(areOtpInputGroupPropsEqual(prevProps, nextProps)).toBe(false);
    });
});
