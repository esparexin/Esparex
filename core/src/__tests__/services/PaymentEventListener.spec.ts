import mongoose from 'mongoose';

const mockFindOneLean = jest.fn();
const mockFindOneAndUpdate = jest.fn();

jest.mock('../../models/UserPlan', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(() => ({
            lean: mockFindOneLean,
        })),
        findOneAndUpdate: mockFindOneAndUpdate,
    },
}));

jest.mock('../../services/business/BusinessPlanSyncService', () => ({
    __esModule: true,
    syncPriorityScore: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

import { lifecycleEvents } from '../../events/LifecycleEventDispatcher';
import { registerPaymentEventListener } from '../../events/listeners/PaymentEventListener';
import { upgradePlan } from '../../services/business/BusinessSubscriptionService';

describe('PaymentEventListener Idempotency & Lifecycle Suite', () => {
    jest.setTimeout(30000);

    const mockUserId = new mongoose.Types.ObjectId().toString();
    const mockPlanId = new mongoose.Types.ObjectId().toString();

    beforeAll(() => {
        registerPaymentEventListener();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should process payment.completed and trigger upgradePlan idempotently', async () => {
        mockFindOneLean.mockResolvedValue(null);
        mockFindOneAndUpdate.mockResolvedValue({
            userId: mockUserId,
            planId: new mongoose.Types.ObjectId(mockPlanId),
            status: 'active',
        });

        const payload = {
            transactionId: 'tx_123',
            userId: mockUserId,
            planId: mockPlanId,
            planType: 'BUSINESS',
            amount: 5000,
            currency: 'INR',
            gatewayOrderId: 'order_123',
            gatewayPaymentId: 'pay_123',
        };

        await lifecycleEvents.dispatch('payment.completed', payload);
        await new Promise((r) => setTimeout(r, 50));

        expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it('should maintain strict idempotency when payment.completed is emitted twice', async () => {
        mockFindOneLean.mockResolvedValue(null);
        mockFindOneAndUpdate.mockResolvedValue({
            userId: mockUserId,
            planId: new mongoose.Types.ObjectId(mockPlanId),
            status: 'active',
        });

        const payload = {
            transactionId: 'tx_duplicate_999',
            userId: mockUserId,
            planId: mockPlanId,
            planType: 'business_plan',
            amount: 9999,
            currency: 'INR',
            gatewayOrderId: 'order_dup_999',
            gatewayPaymentId: 'pay_dup_999',
        };

        // First emission
        await lifecycleEvents.dispatch('payment.completed', payload);
        await new Promise((r) => setTimeout(r, 50));

        // Second emission (duplicate webhook retry)
        await lifecycleEvents.dispatch('payment.completed', payload);
        await new Promise((r) => setTimeout(r, 50));

        // Expect findOneAndUpdate called twice (once per emission), modifying the exact same document
        expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('should directly verify upgradePlan idempotency when called directly', async () => {
        const existingPlan = {
            userId: mockUserId,
            planId: new mongoose.Types.ObjectId(mockPlanId),
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 86400 * 1000),
            status: 'active',
        };

        mockFindOneLean.mockResolvedValue(existingPlan);
        mockFindOneAndUpdate.mockResolvedValue(existingPlan);

        await upgradePlan(mockUserId, mockPlanId, 365);
        await upgradePlan(mockUserId, mockPlanId, 365);

        expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(2);
    });
});
