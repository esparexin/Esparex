jest.mock('../../models/AdminMetrics', () => ({
    __esModule: true,
    AdminMetrics: {
        findOne: jest.fn(),
    },
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../models/Business', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        findOne: jest.fn(),
    },
}));

jest.mock('../../models/User', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    },
}));

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([]) }),
    },
}));

jest.mock('../../services/business/BusinessLifecycleService');
jest.mock('../../domains/notifications/application/NotificationService');
jest.mock('../../services/business/BusinessSubscriptionService');
jest.mock('../../domains/trust');

import { approveAdminBusiness, rejectAdminBusiness } from '../../services/adminBusiness/business';
import * as businessLifecycleService from '../../services/business/BusinessLifecycleService';
import * as NotificationService from '../../domains/notifications/application/NotificationService';
import * as BusinessSubscriptionService from '../../services/business/BusinessSubscriptionService';
import * as TrustService from '../../domains/trust';

describe('Admin Business Approval & Rejection Email Integration', () => {
    const mockLogFn = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        jest.clearAllMocks();
        (BusinessSubscriptionService.assignDefaultPlan as jest.Mock).mockResolvedValue(undefined);
        (TrustService.recalculateTrustScore as jest.Mock).mockResolvedValue(undefined);
    });

    it('dispatches multi-channel notification including email on business approval', async () => {
        const mockBusiness = {
            _id: 'biz_123456789012345678901234',
            userId: 'user_987654321098765432109876',
            name: 'Apex Automotive Parts',
            email: 'apex@example.com',
            status: 'live',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };

        (businessLifecycleService.approveBusiness as jest.Mock).mockResolvedValue(mockBusiness);
        (NotificationService.dispatchTemplatedNotification as jest.Mock).mockResolvedValue(undefined);

        const result = await approveAdminBusiness(mockBusiness._id, 'admin_001', mockLogFn);

        expect(result).toBe(mockBusiness);
        expect(businessLifecycleService.approveBusiness).toHaveBeenCalledWith(mockBusiness._id, 'admin_001');
        expect(NotificationService.dispatchTemplatedNotification).toHaveBeenCalledWith(
            mockBusiness.userId,
            'BUSINESS_STATUS',
            'BUSINESS_APPROVED',
            { name: 'Apex Automotive Parts' },
            expect.objectContaining({
                businessId: mockBusiness._id,
                status: 'live',
                channels: ['in-app', 'push', 'email'],
                email: 'apex@example.com',
                emailSubject: 'Your Business Profile is Approved — Esparex',
                emailHtml: expect.stringContaining('Business Profile Approved! 🏢'),
            })
        );
    });

    it('dispatches multi-channel notification including email on business rejection', async () => {
        const mockBusiness = {
            _id: 'biz_123456789012345678901234',
            userId: 'user_987654321098765432109876',
            name: 'Apex Automotive Parts',
            email: 'apex@example.com',
            status: 'rejected',
        };

        (businessLifecycleService.rejectBusiness as jest.Mock).mockResolvedValue(mockBusiness);
        (NotificationService.dispatchTemplatedNotification as jest.Mock).mockResolvedValue(undefined);

        const reason = 'GST certificate illegible and phone number unverified';
        const result = await rejectAdminBusiness(mockBusiness._id, reason, 'admin_001', mockLogFn);

        expect(result).toBe(mockBusiness);
        expect(businessLifecycleService.rejectBusiness).toHaveBeenCalledWith(mockBusiness._id, reason, 'admin_001');
        expect(NotificationService.dispatchTemplatedNotification).toHaveBeenCalledWith(
            mockBusiness.userId,
            'BUSINESS_STATUS',
            'BUSINESS_REJECTED',
            { name: 'Apex Automotive Parts', reason },
            expect.objectContaining({
                businessId: mockBusiness._id,
                status: 'rejected',
                channels: ['in-app', 'push', 'email'],
                email: 'apex@example.com',
                emailSubject: 'Business Application Update — Esparex',
                emailHtml: expect.stringContaining('GST certificate illegible and phone number unverified'),
            })
        );
    });
});
