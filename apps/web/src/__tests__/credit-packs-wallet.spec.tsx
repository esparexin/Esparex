import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CreditPackListCard } from '@/components/user/profile/cards/CreditPackListCard';
import type { CreditPackDTO } from '@esparex/contracts';

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
          entitlementType: 'SMART_ALERT_SLOT',
          reason: 'Smart Alert slot consumed',
          createdAt: '2026-09-20T10:00:00.000Z',
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

describe('Wallet & Credits UI/UX Architecture', () => {
  const mockPacks: CreditPackDTO[] = [
    {
      packId: 'pack-1',
      planName: 'Smart Alerts Pack',
      entitlementType: 'SMART_ALERT_SLOT',
      sourceType: 'PURCHASED_PACK',
      purchaseDate: '2026-09-01T00:00:00.000Z',
      totalGranted: 1,
      consumed: 0,
      remaining: 1,
      status: 'ACTIVE',
      expiresAt: '2026-10-20T00:00:00.000Z',
    },
    {
      packId: 'pack-2',
      planName: 'Smart Alerts Pack',
      entitlementType: 'SMART_ALERT_SLOT',
      sourceType: 'PURCHASED_PACK',
      purchaseDate: '2026-09-01T00:00:00.000Z',
      totalGranted: 1,
      consumed: 0,
      remaining: 1,
      status: 'ACTIVE',
      expiresAt: '2026-10-05T00:00:00.000Z',
    },
    {
      packId: 'pack-3',
      planName: 'Smart Alerts Pack',
      entitlementType: 'SMART_ALERT_SLOT',
      sourceType: 'PURCHASED_PACK',
      purchaseDate: '2026-09-01T00:00:00.000Z',
      totalGranted: 1,
      consumed: 0,
      remaining: 1,
      status: 'ACTIVE',
      expiresAt: '2026-10-05T00:00:00.000Z',
    },
    {
      packId: 'pack-4',
      planName: 'Smart Alerts Pack',
      entitlementType: 'SMART_ALERT_SLOT',
      sourceType: 'PURCHASED_PACK',
      purchaseDate: '2026-09-01T00:00:00.000Z',
      totalGranted: 1,
      consumed: 0,
      remaining: 1,
      status: 'ACTIVE',
      expiresAt: '2026-10-05T00:00:00.000Z',
    },
  ];

  it('aggregates individual credit packs into unified credit pool cards', () => {
    const html = renderToStaticMarkup(<CreditPackListCard creditPacks={mockPacks} />);

    // Total Smart Alerts balance summary must show 4 Available and aggregated metrics
    expect(html).toContain('4 Available');
    expect(html).toContain('Smart Alerts');
    expect(html).toContain('Granted:');
    expect(html).toContain('Used:');
    expect(html).toContain('Active Credits (4)');
    expect(html).toContain('View 4 Purchase Batches');

    // Should NOT show redundant duplicate category pill when only 1 category exists
    expect(html).not.toContain('All Packs (4)');
  });

  it('renders category filter pills only when multiple credit categories exist', () => {
    const multiCategoryPacks: CreditPackDTO[] = [
      ...mockPacks,
      {
        packId: 'pack-5',
        planName: 'Ad Postings Pack',
        entitlementType: 'AD_POSTING',
        sourceType: 'PURCHASED_PACK',
        purchaseDate: '2026-09-01T00:00:00.000Z',
        totalGranted: 5,
        consumed: 1,
        remaining: 4,
        status: 'ACTIVE',
        expiresAt: '2026-10-30T00:00:00.000Z',
      },
    ];

    const html = renderToStaticMarkup(<CreditPackListCard creditPacks={multiCategoryPacks} />);

    // Multi-category should render category filters
    expect(html).toContain('All Active (5)');
    expect(html).toContain('Smart Alerts (4)');
    expect(html).toContain('Ad Postings (4)');
  });

  it('renders single-instance responsive credit history with desktop table and mobile cards', () => {
    const html = renderToStaticMarkup(<CreditLedgerHistoryCard />);

    // Desktop table container must be hidden on mobile
    expect(html).toContain('hidden md:block');
    expect(html).toContain('<table');

    // Mobile card container must be hidden on desktop
    expect(html).toContain('md:hidden');

    // Human-readable formatted reasons
    expect(html).toContain('Smart Alert Slot Consumed');
    expect(html).toContain('-1 USED');
    expect(html).toContain('+5 ADDED');
  });

  it('renders dedicated Credit History tab in PlansTab hub navigation', () => {
    const html = renderToStaticMarkup(
      <PlansTab dynamicPlans={[]} currentPlan="Free" />
    );

    expect(html).toContain('id="tab-overview"');
    expect(html).toContain('id="tab-credit-packs"');
    expect(html).toContain('id="tab-credit-history"');
    expect(html).toContain('Credit History');
    expect(html).toContain('id="tab-invoices"');
  });

  it('renders View Credit History shortcut in CreditPackListCard when onViewHistory is provided', () => {
    const html = renderToStaticMarkup(
      <CreditPackListCard creditPacks={mockPacks} onViewHistory={vi.fn()} />
    );

    expect(html).toContain('View Credit History →');
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
          autoRenew: true,
        }}
        nextMonthlyResetDate="2026-10-01T00:00:00.000Z"
      />
    );

    expect(activeHtml).toContain('More Ads 20-Pack');
    expect(activeHtml).toContain('Active Plan');
    expect(activeHtml).toContain('Purchased:');
    expect(activeHtml).toContain('Valid until:');
    expect(activeHtml).toContain('11 days left');

    // Expired plan
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
          autoRenew: false,
        }}
        onBrowsePlans={vi.fn()}
      />
    );

    expect(expiredHtml).toContain('Expired');
    expect(expiredHtml).toContain('Renew Plan');
    expect(expiredHtml).toContain('Your plan expired on');
  });

  it('renders clear expiration dates and status chips in past/used credit packs', () => {
    const historicalPacks: CreditPackDTO[] = [
      {
        packId: 'expired-1',
        planName: 'Old Alert Pack',
        entitlementType: 'SMART_ALERT_SLOT',
        sourceType: 'PURCHASED_PACK',
        purchaseDate: '2026-07-01T00:00:00.000Z',
        totalGranted: 2,
        consumed: 0,
        remaining: 0,
        status: 'EXPIRED',
        expiresAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    const html = renderToStaticMarkup(<CreditPackListCard creditPacks={historicalPacks} />);

    expect(html).toContain('Past / Used');
    expect(html).toContain('Old Alert Pack');
    expect(html).toContain('Expired');
    expect(html).toContain('Purchased:');
    expect(html).toContain('Expired on:');
  });

  it('strictly excludes expired credit packs from active pools and active balances even if raw status is ACTIVE', () => {
    const mixedPacks: CreditPackDTO[] = [
      {
        packId: 'active-valid',
        planName: 'Fresh Alert Pack',
        entitlementType: 'SMART_ALERT_SLOT',
        sourceType: 'PURCHASED_PACK',
        purchaseDate: '2026-09-01T00:00:00.000Z',
        totalGranted: 2,
        consumed: 0,
        remaining: 2,
        status: 'ACTIVE',
        expiresAt: '2026-10-30T00:00:00.000Z',
      },
      {
        packId: 'expired-still-marked-active',
        planName: 'Expired Alert Pack',
        entitlementType: 'SMART_ALERT_SLOT',
        sourceType: 'PURCHASED_PACK',
        purchaseDate: '2026-07-01T00:00:00.000Z',
        totalGranted: 5,
        consumed: 0,
        remaining: 5,
        status: 'ACTIVE',
        expiresAt: '2026-08-01T00:00:00.000Z', // In the past!
      },
    ];

    const html = renderToStaticMarkup(<CreditPackListCard creditPacks={mixedPacks} />);

    // Active summary should ONLY count the 2 unexpired credits, NOT the 5 expired credits (7 total)
    expect(html).toContain('2 Available');
    expect(html).not.toContain('7 Available');

    // The expired pack should be recognized in Past / Used tab badge
    expect(html).toContain('Past / Used (1)');
  });
});
