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
        find: jest.fn(),
    },
}));

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        updateMany: jest.fn(),
    },
}));

jest.mock('../../domains/payments/domain/policies/PlanEngine', () => ({
    calculateUserPlan: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        debug: jest.fn(),
        error: jest.fn(),
    },
}));

import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';
import Ad from '../../models/Ad';
import { calculateUserPlan } from '../../domains/payments/domain/policies/PlanEngine';
import { syncPriorityScore } from '../../services/business/BusinessPlanSyncService';

const mockPlan = Plan as unknown as { findOne: jest.Mock };
const mockUserPlan = UserPlan as unknown as { find: jest.Mock };
const mockAd = Ad as unknown as { updateMany: jest.Mock };
const mockCalculateUserPlan = calculateUserPlan as jest.Mock;

describe('BusinessPlanSyncService', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should calculate priority score from active user plans and update ads', async () => {
        const mockPlanDoc = { code: 'BUSINESS_PRO', features: { priorityWeight: 10 } };
        mockUserPlan.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ planId: mockPlanDoc }]),
            }),
        });

        mockCalculateUserPlan.mockReturnValue({ priorityScore: 10 });
        mockAd.updateMany.mockResolvedValue({ modifiedCount: 3 });

        await syncPriorityScore(userId);

        expect(mockCalculateUserPlan).toHaveBeenCalledWith([mockPlanDoc]);
        expect(mockAd.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                status: { $in: ['live', 'pending'] },
                isDeleted: { $ne: true },
            }),
            { $set: { sellerPriorityScore: 10 } }
        );
    });

    it('should fall back to Free plan priority from DB when no active business plan priority exists', async () => {
        mockUserPlan.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });

        mockCalculateUserPlan.mockReturnValue({ priorityScore: 0 });
        mockPlan.findOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({ features: { priorityWeight: 2 } }),
            }),
        });
        mockAd.updateMany.mockResolvedValue({ modifiedCount: 1 });

        await syncPriorityScore(userId);

        expect(mockPlan.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                isDefault: true,
                userType: { $in: ['both', 'normal'] },
                active: true,
            })
        );
        expect(mockAd.updateMany).toHaveBeenCalledWith(
            expect.anything(),
            { $set: { sellerPriorityScore: 2 } }
        );
    });

    it('should default fallback score to 1 if Free plan is not found in DB', async () => {
        mockUserPlan.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        });

        mockCalculateUserPlan.mockReturnValue({ priorityScore: 0 });
        mockPlan.findOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        });

        await syncPriorityScore(userId);

        expect(mockAd.updateMany).toHaveBeenCalledWith(
            expect.anything(),
            { $set: { sellerPriorityScore: 1 } }
        );
    });
});
