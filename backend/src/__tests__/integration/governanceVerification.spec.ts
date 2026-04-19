
import Business from '../../models/Business';
import Ad from '../../models/Ad';
import { runSuspendExpiredBusinessesJob } from '../../jobs/suspendExpiredBusinesses.job';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { MODERATION_STATUS } from '../../../../shared/enums/moderationStatus';

// Mock dependencies
jest.mock('../../models/Business');
jest.mock('../../models/Ad');
jest.mock('../../utils/distributedJobLock', () => ({
    runWithDistributedJobLock: jest.fn((name, opts, fn) => fn())
}));
jest.mock('../../utils/jobRunner', () => ({
    jobRunner: jest.fn((name, fn) => fn())
}));
jest.mock('../../services/NotificationService', () => ({
    dispatchTemplatedNotification: jest.fn()
}));
jest.mock('../../utils/logger');

describe('Governance Fixes Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('verifies that runSuspendExpiredBusinessesJob deactivates ads of newly suspended businesses', async () => {
        const mockUserId = 'user123';
        const mockBusiness = { _id: 'biz123', userId: mockUserId, name: 'Test Biz' };

        // 1. Mock Business.updateMany to simulate finding expired businesses
        (Business.updateMany as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

        // 2. Mock Business.find to return the newly suspended business
        (Business.find as jest.Mock)
            .mockReturnValueOnce({ select: jest.fn().mockResolvedValue([mockBusiness]) }) // For warnings (empty in this test)
            .mockReturnValueOnce({ select: jest.fn().mockResolvedValue([mockBusiness]) }); // For secondary effects

        // 3. Mock Ad.updateMany to track its call
        const adUpdateSpy = (Ad.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });

        await runSuspendExpiredBusinessesJob();

        // Verify Ad.updateMany was called for the correct user
        expect(adUpdateSpy).toHaveBeenCalledWith(
            expect.objectContaining({ sellerId: { $in: [mockUserId] }, status: AD_STATUS.LIVE }),
            expect.objectContaining({ 
                $set: expect.objectContaining({ 
                    status: AD_STATUS.PENDING,
                    moderationStatus: MODERATION_STATUS.HELD_FOR_REVIEW 
                }) 
            })
        );
    });
});
