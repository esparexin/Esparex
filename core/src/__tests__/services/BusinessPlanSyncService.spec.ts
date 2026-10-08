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

jest.mock('../../composition/listings', () => ({
    getListingRepository: jest.fn(),
}));

jest.mock('../../domains/payments/application/PlanService', () => ({
    calculateUserPlan: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    },
}));

import Plan from '../../models/Plan';
import UserPlan from '../../models/UserPlan';
import { getListingRepository } from '../../composition/listings';
import { calculateUserPlan } from '../../domains/payments/application/PlanService';
import { syncPriorityScore } from '../../services/business/BusinessPlanSyncService';


const mockPlan = Plan as any;
const mockUserPlan = UserPlan as any;
const mockGetListingRepository = getListingRepository as jest.Mock;
const mockUpdateMany = jest.fn();
const mockCalculateUserPlan = calculateUserPlan as jest.Mock;

describe('BusinessPlanSyncService', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetListingRepository.mockReturnValue({ updateMany: mockUpdateMany });
    });

    it('should calculate priority score from active user plans and update ads', async () => {
        const mockPlanDoc = { code: 'BUSINESS_PRO', features: { priorityWeight: 10 } };
        mockUserPlan.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ planId: mockPlanDoc }]),
            }),
        });

        mockCalculateUserPlan.mockReturnValue({ priorityScore: 10 });
        mockUpdateMany.mockResolvedValue(3);

        await syncPriorityScore(userId);

        expect(mockCalculateUserPlan).toHaveBeenCalledWith([mockPlanDoc]);
        expect(mockUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                status: { $in: ['live', 'pending'] },
                isDeleted: { $ne: true },
            }),
            { sellerPriorityScore: 10 }
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
        mockUpdateMany.mockResolvedValue(1);

        await syncPriorityScore(userId);

        expect(mockPlan.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                isDefault: true,
                userType: { $in: ['both', 'normal'] },
                active: true,
            })
        );
        expect(mockUpdateMany).toHaveBeenCalledWith(
            expect.anything(),
            { sellerPriorityScore: 2 }
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

        expect(mockUpdateMany).toHaveBeenCalledWith(
            expect.anything(),
            { sellerPriorityScore: 1 }
        );
    });
});
