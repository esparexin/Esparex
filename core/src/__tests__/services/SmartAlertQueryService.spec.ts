jest.mock('../../models/Notification', () => ({
    find: jest.fn(),
    countDocuments: jest.fn(),
}));

jest.mock('../../models/Ad', () => ({
    find: jest.fn(),
}));

jest.mock('../../models/SmartAlert', () => ({
    find: jest.fn(),
    countDocuments: jest.fn(),
}));

jest.mock('../../models/UserWallet', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../models/Entitlement', () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
    },
}));

jest.mock('../../domains/boosts/application/services/AdSlotService', () => ({
    syncWalletCycle: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../domains/payments', () => ({
    calculateUserPlan: jest.fn(),
    UserPlanModel: {
        find: jest.fn(),
    },
    PlanModel: {
        find: jest.fn(),
    },
}));

import mongoose from 'mongoose';
import Notification from '../../models/Notification';
import Ad from '../../models/Ad';
import UserWallet from '../../models/UserWallet';
import Entitlement from '../../models/Entitlement';
import { UserPlanModel, PlanModel, calculateUserPlan } from '../../domains/payments';
import { getSmartAlertMatchesForUser, getSmartAlertQuotaForUser } from '../../domains/notifications/application/SmartAlertQueryService';

describe('SmartAlertQueryService - getSmartAlertMatchesForUser', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const adId1 = new mongoose.Types.ObjectId().toString();
    const adId2 = new mongoose.Types.ObjectId().toString();
    const alertId1 = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns paginated matches with hydrated ad summaries', async () => {
        const mockNotifications = [
            {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(userId),
                type: 'SMART_ALERT',
                message: 'A new ad matches your alert: iPhone Deals',
                data: {
                    adId: adId1,
                    alertId: alertId1,
                    alertName: 'iPhone Deals',
                    actionUrl: `/ads/${adId1}`,
                },
                createdAt: new Date('2026-09-20T10:00:00Z'),
                isRead: false,
            },
            {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(userId),
                type: 'SMART_ALERT',
                message: 'A new ad matches your alert: MacBook Pro',
                data: {
                    adId: adId2,
                    alertId: 'other-alert',
                },
                createdAt: new Date('2026-09-20T09:00:00Z'),
                isRead: true,
            },
        ];

        const mockAds = [
            {
                _id: new mongoose.Types.ObjectId(adId1),
                title: 'iPhone 13 Pro Max 128GB',
                price: 650,
                currency: 'USD',
                images: ['https://example.com/iphone.jpg'],
                status: 'active',
                location: { city: 'New York', state: 'NY', display: 'New York, NY' },
                seoSlug: 'iphone-13-pro-max',
                listingType: 'ad',
                isSold: false,
            },
        ];

        const mockNotificationQuery = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockNotifications),
        };

        (Notification.find as jest.Mock).mockReturnValue(mockNotificationQuery);
        (Notification.countDocuments as jest.Mock).mockResolvedValue(2);

        const mockAdQuery = {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockAds),
        };
        (Ad.find as jest.Mock).mockReturnValue(mockAdQuery);

        const result = await getSmartAlertMatchesForUser(userId, { page: 1, limit: 10 });

        expect(result.total).toBe(2);
        expect(result.matches).toHaveLength(2);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);

        // Match 1: hydrated ad
        expect(result.matches[0].alertName).toBe('iPhone Deals');
        expect(result.matches[0].ad).not.toBeNull();
        expect(result.matches[0].ad?.title).toBe('iPhone 13 Pro Max 128GB');
        expect(result.matches[0].actionUrl).toBe(`/ads/${adId1}`);

        // Match 2: ad not found in DB (deleted), extracted alert name from message
        expect(result.matches[1].alertName).toBe('MacBook Pro');
        expect(result.matches[1].ad).toBeNull();
        expect(result.matches[1].actionUrl).toBe(`/ads/${adId2}`);
    });

    it('filters by alertId when provided', async () => {
        const mockNotificationQuery = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        };

        (Notification.find as jest.Mock).mockReturnValue(mockNotificationQuery);
        (Notification.countDocuments as jest.Mock).mockResolvedValue(0);

        await getSmartAlertMatchesForUser(userId, { alertId: alertId1 });

        expect(Notification.find).toHaveBeenCalledWith(
            expect.objectContaining({
                'data.alertId': alertId1,
            })
        );
    });
});

describe('SmartAlertQueryService - getSmartAlertQuotaForUser', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        (Entitlement.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
        });
    });

    it('returns default 2 limit and accurate remaining when free user has 1 used', async () => {
        (UserPlanModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
        });
        (UserWallet.findOne as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                monthlyFreeAlertsUsed: 1,
                smartAlertSlots: 2,
            }),
        });

        const quota = await getSmartAlertQuotaForUser(userId);

        expect(quota.limit).toBe(2);
        expect(quota.used).toBe(1);
        expect(quota.remaining).toBe(1);
        expect(quota.resetsAt).toBeDefined();
        expect(new Date(quota.resetsAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('includes paid entitlement slots in total limit and remaining capacity', async () => {
        (UserPlanModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
        });
        (UserWallet.findOne as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                monthlyFreeAlertsUsed: 2, // free exhausted
                smartAlertSlots: 5,
            }),
        });
        (Entitlement.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { remaining: 3, type: 'SMART_ALERT_SLOT', status: 'ACTIVE' },
            ]),
        });

        const quota = await getSmartAlertQuotaForUser(userId);

        expect(quota.limit).toBe(5); // 2 base + 3 paid
        expect(quota.used).toBe(2);
        expect(quota.remaining).toBe(3); // 0 free + 3 paid
    });
});
