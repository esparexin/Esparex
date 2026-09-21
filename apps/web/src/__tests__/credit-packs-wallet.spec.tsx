import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CreditPackListCard } from '@/components/user/profile/cards/CreditPackListCard';
import type { CreditPackDTO, WalletSummaryDTO } from '@esparex/contracts';

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
      purchaseDate: '2026-09-02T00:00:00.000Z',
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
      purchaseDate: '2026-09-03T00:00:00.000Z',
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
      purchaseDate: '2026-09-04T00:00:00.000Z',
      totalGranted: 1,
      consumed: 0,
      remaining: 1,
      status: 'ACTIVE',
      expiresAt: '2026-10-05T00:00:00.000Z',
    },
  ];

  it('displays individual non-merged purchased plans with credit wallet summary', () => {
    const html = renderToStaticMarkup(<CreditPackListCard creditPacks={mockPacks} />);

    // Credit Wallet Executive Summary
    expect(html).toContain('Total Purchased');
    expect(html).toContain('Used');
    expect(html).toContain('4 Available');

    // Filter controls
    expect(html).toContain('All Purchases (4)');
    expect(html).toContain('Active Credits (4)');

    // Each purchase must be displayed as an individual non-merged entry
    expect(html).toContain('Smart Alerts Pack');
    expect(html).toContain('1 total');
    expect(html).toContain('0 used');
    expect(html).toContain('Active');
    expect(html).toContain('Valid until:');

    // Desktop table container and Mobile cards must exist
    expect(html).toContain('hidden md:block');
    expect(html).toContain('md:hidden');
  });

  it('renders purchase filter navigation correctly with active and total counts', () => {
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

    expect(html).toContain('All Purchases (5)');
    expect(html).toContain('Active Credits (5)');
    expect(html).toContain('Ad Postings');
    expect(html).toContain('Smart Alerts');
  });

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
    expect(html).toContain('My Plan &amp; Allowances');
    expect(html).toContain('id="tab-credit-history"');
    expect(html).toContain('Credit History');
    expect(html).toContain('id="tab-invoices"');
    expect(html).not.toContain('id="tab-credit-packs"');
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
    expect(expiredHtml).toContain('Upgrade Plan');
    expect(expiredHtml).not.toContain('Renew Plan');
    expect(expiredHtml).not.toContain('Your plan expired on');
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

    expect(html).toContain('Past / Used (1)');
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
    };

    const handleNavigate = vi.fn();

    const html = renderToStaticMarkup(
      <WalletOverviewCard wallet={mockWallet} onNavigateToHistory={handleNavigate} />
    );

    expect(html).toContain('5 Available');
    expect(html).toContain('2 Active');
    expect(html).toContain('0 Credits');
    expect(html).toContain('View Credit History');
  });

  it('renders de-boxed credit history with dynamic filter chips and usage ledger', () => {
    const html = renderToStaticMarkup(
      <CreditLedgerHistoryCard creditPacks={mockPacks} />
    );

    expect(html).toContain('Credit Usage History');
    expect(html).toContain('Smart Alerts');
    // Confirms the duplicate 4 boxes are successfully removed
    expect(html).not.toContain('Purchased Credit Allocations');
  });
});
