import { PLATFORM_QUOTAS } from '@esparex/contracts';
import { PlansWalletMapper } from '../../domains/payments/mappers/PlansWalletMapper';

describe('Architecture SSOT Gate: Plans, Wallet & Smart Alert Quota Consistency', () => {
    it('enforces canonical platform quota baseline constants', () => {
        expect(PLATFORM_QUOTAS.FREE_SMART_ALERT_LIMIT).toBe(2);
        expect(PLATFORM_QUOTAS.FREE_MONTHLY_AD_LIMIT).toBe(5);
    });

    it('maps freeAlertSlotsBase from PLATFORM_QUOTAS and computes total slots without double-counting', () => {
        const dto = PlansWalletMapper.mapToV1DTO({
            userWallet: {
                userId: 'user_123',
                monthlyFreeAdsUsed: 1,
            },
            entitlements: [
                {
                    type: 'SMART_ALERT_SLOT',
                    status: 'ACTIVE',
                    remaining: 3,
                    startsAt: new Date(),
                },
            ],
            boosts: [],
            creditTransactions: [],
            paymentTransactions: [],
        });

        // free base is 2
        expect(dto.wallet.freeAlertSlotsBase).toBe(PLATFORM_QUOTAS.FREE_SMART_ALERT_LIMIT);
        expect(dto.wallet.paidAlertSlots).toBe(3);
        // total alert slots = 2 free base + 3 paid = 5
        expect(dto.wallet.smartAlertSlots).toBe(5);
        // default free ads limit is 5
        expect(dto.wallet.monthlyFreeAdsTotal).toBe(PLATFORM_QUOTAS.FREE_MONTHLY_AD_LIMIT);
        expect(dto.wallet.monthlyFreeAdsRemaining).toBe(4);
    });

    it('preserves free user defaults when no paid entitlements exist', () => {
        const dto = PlansWalletMapper.mapToV1DTO({
            userWallet: {
                userId: 'user_456',
                smartAlertSlots: 2,
            },
            entitlements: [],
            boosts: [],
            creditTransactions: [],
            paymentTransactions: [],
        });

        expect(dto.wallet.freeAlertSlotsBase).toBe(2);
        expect(dto.wallet.paidAlertSlots).toBe(0);
        expect(dto.wallet.smartAlertSlots).toBe(2);
    });
});
