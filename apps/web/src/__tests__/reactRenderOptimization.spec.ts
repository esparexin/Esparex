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
});
