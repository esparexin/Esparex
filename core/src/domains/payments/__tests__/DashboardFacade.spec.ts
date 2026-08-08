import { DashboardFacade } from '../application/DashboardFacade';
import { PlansWalletMapper } from '../mappers/PlansWalletMapper';

describe('DashboardFacade', () => {
  it('should project raw domain data into a valid PlansWalletV1DTO shape', () => {
    const rawData = {
      userPlan: {
        planId: { _id: 'plan_123', name: 'Pro Seller Tier', category: 'PRO' },
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'active',
      },
      userWallet: {
        userId: 'user_456',
        monthlyFreeAdsUsed: 3,
        adCredits: 15,
        spotlightCredits: 2,
        boostCredits: 5,
        smartAlertSlots: 2,
      },
      entitlements: [
        {
          _id: 'ent_1',
          type: 'AD_POSTING',
          quantity: 10,
          consumed: 2,
          remaining: 8,
          sourceType: 'PURCHASED_PACK',
          startsAt: new Date('2026-07-01'),
          expiresAt: new Date('2026-10-01'),
          status: 'ACTIVE',
        },
      ],
      boosts: [
        {
          _id: 'boost_1',
          entityId: 'ad_999',
          entityTitle: 'MacBook Pro',
          type: 'SPOTLIGHT_CAT',
          startsAt: new Date('2026-08-01'),
          endsAt: new Date('2026-08-08'),
        },
      ],
      creditTransactions: [
        {
          _id: 'ctx_1',
          type: 'DEBIT',
          creditPool: 'PURCHASED',
          amount: 1,
          reason: 'Post Ad Listing',
          createdAt: new Date('2026-08-05'),
        },
      ],
      paymentTransactions: [
        {
          _id: 'pay_1',
          amount: 4999,
          currency: 'INR',
          status: 'SUCCESS',
          description: 'Pro Seller Annual',
          createdAt: new Date('2026-01-01'),
        },
      ],
    };

    const dto = PlansWalletMapper.mapToV1DTO(rawData);

    expect(dto).toBeDefined();
    expect(dto.subscription?.planName).toBe('Pro Seller Tier');
    expect(dto.subscription?.category).toBe('PRO');
    expect(dto.wallet.monthlyFreeAdsRemaining).toBe(7);
    expect(dto.wallet.paidAdCredits).toBe(15);
    expect(dto.creditPacks.length).toBe(1);
    expect(dto.creditPacks[0].remaining).toBe(8);
    expect(dto.activePromotions.length).toBe(1);
    expect(dto.recentUsage.length).toBe(1);
    expect(dto.recentPayments.length).toBe(1);
  });

  it('should handle missing optional data gracefully', () => {
    const dto = PlansWalletMapper.mapToV1DTO({
      userWallet: { userId: 'user_123', adCredits: 0 },
    });

    expect(dto).toBeDefined();
    expect(dto.subscription).toBeNull();
    expect(dto.wallet.userId).toBe('user_123');
    expect(dto.creditPacks).toEqual([]);
    expect(dto.activePromotions).toEqual([]);
    expect(dto.recentUsage).toEqual([]);
    expect(dto.recentPayments).toEqual([]);
  });
});
