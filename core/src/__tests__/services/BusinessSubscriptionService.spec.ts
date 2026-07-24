import mongoose from 'mongoose';

jest.mock('../../models/Plan', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../models/UserPlan', () => ({
    __esModule: true,
    default: {
        findOneAndUpdate: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        updateMany: jest.fn(),
    },
}));

jest.mock('../../services/business/BusinessPlanSyncService', () => ({
    syncPriorityScore: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';
import {
    assignDefaultPlan,
    upgradePlan,
    renewPlan,
    expirePlan,
} from '../../services/business/BusinessSubscriptionService';
import { syncPriorityScore } from '../../services/business/BusinessPlanSyncService';

const mockPlan = Plan as unknown as { findOne: jest.Mock };
const mockUserPlan = UserPlan as unknown as {
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    updateMany: jest.Mock;
};
const mockSyncPriorityScore = syncPriorityScore as jest.Mock;

describe('BusinessSubscriptionService', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const planId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('assignDefaultPlan', () => {
        it('should dynamically find active default business plan and assign to user', async () => {
            mockPlan.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue({
                    _id: planId,
                    code: 'BUSINESS_BASE',
                    durationDays: 365,
                }),
            });
            mockUserPlan.findOneAndUpdate.mockResolvedValue({});

            await assignDefaultPlan(userId);

            expect(mockPlan.findOne).toHaveBeenCalledWith({
                isDefault: true,
                userType: 'business',
                active: true,
            });
            expect(mockUserPlan.findOneAndUpdate).toHaveBeenCalledWith(
                { userId, planId },
                expect.objectContaining({
                    $set: expect.objectContaining({ status: 'active' }),
                }),
                expect.any(Object)
            );
        });

        it('should log warning and abort gracefully if no default business plan exists', async () => {
            mockPlan.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await assignDefaultPlan(userId);

            expect(mockUserPlan.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe('upgradePlan', () => {
        it('should activate purchased plan via UserPlan findOneAndUpdate', async () => {
            mockUserPlan.findOneAndUpdate.mockResolvedValue({});

            await upgradePlan(userId, planId, 365);

            expect(mockUserPlan.findOneAndUpdate).toHaveBeenCalledWith(
                { userId, planId: new mongoose.Types.ObjectId(planId) },
                expect.objectContaining({
                    $set: expect.objectContaining({ status: 'active' }),
                }),
                expect.any(Object)
            );
        });
    });

    describe('renewPlan', () => {
        it('should extend plan duration from current endDate if in future', async () => {
            const futureEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            mockUserPlan.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue({ endDate: futureEndDate }),
            });
            mockUserPlan.findOneAndUpdate.mockResolvedValue({});

            await renewPlan(userId, planId, 365);

            expect(mockUserPlan.findOneAndUpdate).toHaveBeenCalledWith(
                { userId, planId: new mongoose.Types.ObjectId(planId) },
                expect.objectContaining({
                    $set: expect.objectContaining({ status: 'active' }),
                }),
                expect.any(Object)
            );
        });
    });

    describe('expirePlan', () => {
        it('should populate planId to identify business plans and expire only business plans', async () => {
            mockUserPlan.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([
                        { planId: { _id: planId, userType: 'business' } },
                        { planId: { _id: 'other-id', userType: 'normal' } },
                    ]),
                }),
            });

            mockUserPlan.updateMany.mockResolvedValue({ modifiedCount: 1 });

            await expirePlan(userId);

            expect(mockUserPlan.updateMany).toHaveBeenCalledWith(
                {
                    userId,
                    planId: { $in: [planId] },
                    status: 'active',
                },
                { $set: { status: 'expired' } }
            );
        });

        it('should not update any UserPlan if user has no business plans', async () => {
            mockUserPlan.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([
                        { planId: { _id: 'other-id', userType: 'normal' } },
                    ]),
                }),
            });

            await expirePlan(userId);

            expect(mockUserPlan.updateMany).not.toHaveBeenCalled();
        });
    });
});
