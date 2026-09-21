import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { WalletSummaryDTO } from '@esparex/contracts';

// Mock useCreditLedgerHistory
vi.mock('@/hooks/useCreditLedgerHistory', () => ({
  useCreditLedgerHistory: () => ({
    data: {
      items: [
        {
          transactionId: 'tx-1',
          type: 'DEBIT',
          creditPool: 'PURCHASED',
          amount: 1,
          entitlementType: 'SPOTLIGHT_HP',
          reason: 'Applied Spotlight to ad 60d5ec49f1b2c8a1e8c9a001',
          createdAt: '2026-09-20T10:00:00.000Z',
          listingId: '60d5ec49f1b2c8a1e8c9a001',
          adTitle: 'Toyota Corolla 2022 Hybrid',
          adSlug: 'toyota-corolla-2022-hybrid',
          adStatus: 'ACTIVE',
          validityText: '1 day',
          spotlightStatus: 'ACTIVE',
        },
        {
          transactionId: 'tx-2',
          type: 'CREDIT',
          creditPool: 'FREE_ALLOWANCE',
          amount: 5,
          entitlementType: 'AD_POSTING',
          reason: 'Monthly plan renewal',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePlansWalletDashboard', () => ({
  usePlansWalletDashboard: () => ({
    dashboardData: {
      subscription: null,
      wallet: { balance: 10, totalEarned: 10, totalSpent: 0 },
      activePromotions: [],
      creditPacks: [],
      recentPayments: [],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

import { CreditLedgerHistoryCard } from '@/components/user/profile/cards/CreditLedgerHistoryCard';
import { PlansTab } from '@/components/user/profile/tabs/PlansTab';
import { ActiveSubscriptionCard } from '@/components/user/profile/cards/ActiveSubscriptionCard';
import { WalletOverviewCard } from '@/components/user/profile/cards/WalletOverviewCard';

describe('Wallet & Credits UI/UX Architecture', () => {
  it('renders single-instance responsive credit history with ad traceability and independent statuses', () => {
    const html = renderToStaticMarkup(<CreditLedgerHistoryCard />);

    // Desktop table container must be hidden on mobile
    expect(html).toContain('hidden md:block');
    expect(html).toContain('<table');

    // Mobile card container must be hidden on desktop
    expect(html).toContain('md:hidden');

    // Human-readable formatted activity
    expect(html).toContain('Spotlight Credit Used — 1 credit');
    expect(html).toContain('-1 USED');
    expect(html).toContain('+5 ADDED');

    // Ad traceability and link
    expect(html).toContain('/ads/toyota-corolla-2022-hybrid');
    expect(html).toContain('Toyota Corolla 2022 Hybrid');

    // Applied validity and independent spotlight / ad status
    expect(html).toContain('1 day');
    expect(html).toContain('Active');
  });

  it('renders dedicated Credit History tab in PlansTab hub navigation', () => {
    const html = renderToStaticMarkup(
      <PlansTab dynamicPlans={[]} currentPlan="Free" />
    );

    expect(html).toContain('id="tab-overview"');
    expect(html).toContain('Wallet &amp; Balances');
    expect(html).toContain('Available Balances');
    expect(html).not.toContain('Free Starter Plan');
    expect(html).toContain('id="tab-credit-history"');
    expect(html).toContain('My Usage');
    expect(html).toContain('id="tab-invoices"');
    expect(html).not.toContain('id="tab-credit-packs"');
  });

  it('renders purchased plan validity, days left, and expiration warnings in ActiveSubscriptionCard', () => {
    // Active plan with end date
    const activeHtml = renderToStaticMarkup(
      <ActiveSubscriptionCard
        subscription={{
          planId: 'p-1',
          planName: 'More Ads 20-Pack',
          category: 'PRO',
          status: 'ACTIVE',
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-10-01T00:00:00.000Z',
          daysRemaining: 11,
        }}
        nextMonthlyResetDate="2026-10-01T00:00:00.000Z"
      />
    );

    expect(activeHtml).toContain('More Ads 20-Pack');
    expect(activeHtml).toContain('Active Plan');
    expect(activeHtml).toContain('Purchased:');
    expect(activeHtml).toContain('Valid until:');
    expect(activeHtml).toContain('11 days left');

    // Expired plan returns empty to eliminate noisy banner boxes
    const expiredHtml = renderToStaticMarkup(
      <ActiveSubscriptionCard
        subscription={{
          planId: 'p-2',
          planName: 'Spotlight Booster',
          category: 'PRO',
          status: 'EXPIRED',
          startDate: '2026-08-01T00:00:00.000Z',
          endDate: '2026-09-01T00:00:00.000Z',
          daysRemaining: 0,
        }}
        onBrowsePlans={vi.fn()}
      />
    );

    expect(expiredHtml).toBe('');
  });

  it('renders clean allowance breakdown and view history link in WalletOverviewCard', () => {
    const mockWallet: WalletSummaryDTO = {
      userId: 'u-1',
      monthlyFreeAdsTotal: 5,
      monthlyFreeAdsUsed: 0,
      monthlyFreeAdsRemaining: 5,
      paidAdCredits: 0,
      spotlightCredits: 0,
      topAdCredits: 0,
      smartAlertSlots: 2,
      freeAlertSlotsBase: 2,
      paidAlertSlots: 0,
    };

    const handleNavigate = vi.fn();

    const html = renderToStaticMarkup(
      <WalletOverviewCard wallet={mockWallet} onNavigateToHistory={handleNavigate} />
    );

    expect(html).toContain('Free Ads');
    expect(html).toContain('5 Available');
    expect(html).toContain('2 Active');
    expect(html).not.toContain('Boost Credits');
    expect(html).toContain('View My Usage');
  });

  it('renders de-boxed credit history with dynamic filter chips and usage ledger', () => {
    const mockPacks = [
      {
        packId: 'pack-1',
        planName: 'Smart Alerts Pack',
        entitlementType: 'SMART_ALERT_SLOT' as const,
        sourceType: 'PURCHASED_PACK' as const,
        purchaseDate: '2026-09-01T00:00:00.000Z',
        totalGranted: 1,
        consumed: 0,
        remaining: 1,
        status: 'ACTIVE' as const,
        expiresAt: '2026-10-20T00:00:00.000Z',
      },
    ];

    const html = renderToStaticMarkup(
      <CreditLedgerHistoryCard creditPacks={mockPacks} />
    );

    expect(html).toContain('My Usage');
    expect(html).toContain('Smart Alerts');
    // Confirms the duplicate 4 boxes are successfully removed
    expect(html).not.toContain('Purchased Credit Allocations');
  });
});
