
import Business from '@esparex/core/models/Business';
import Ad from '@esparex/core/models/Ad';
import { runSuspendExpiredBusinessesJob } from '@esparex/core/jobs/suspendExpiredBusinesses.job';
import { LISTING_STATUS } from "@shared/enums/listingStatus";
import { mutateStatusesBulk } from "@esparex/core/services/StatusMutationService";

// Mock dependencies
jest.mock('@esparex/core/models/Business');
jest.mock('@esparex/core/models/Ad');
jest.mock('@esparex/core/utils/distributedJobLock', () => ({
    runWithDistributedJobLock: jest.fn((name, opts, fn) => fn())
}));
jest.mock('@esparex/core/utils/jobRunner', () => ({
    jobRunner: jest.fn((name, fn) => fn())
}));
jest.mock('@esparex/core/services/NotificationService', () => ({
    dispatchTemplatedNotification: jest.fn()
}));
jest.mock('@esparex/core/services/StatusMutationService', () => ({
    mutateStatusesBulk: jest.fn(),
}));
jest.mock('@esparex/core/utils/logger');

describe('Governance Fixes Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('verifies that runSuspendExpiredBusinessesJob deactivates ads of newly suspended businesses', async () => {
        const mockUserId = 'user123';
        const mockBusiness = { _id: 'biz123', userId: mockUserId, name: 'Test Biz', expiresAt: new Date() };

        const buildFindChainWithLean = (rows: unknown[]) => ({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(rows),
            }),
        });

        (Business.find as jest.Mock)
            // expiration warning query: await find(...).select(...)
            .mockReturnValueOnce({ select: jest.fn().mockResolvedValue([]) })
            // suspension query: await find(...).select(...).lean()
            .mockReturnValueOnce(buildFindChainWithLean([mockBusiness]))
            // suspended businesses query: await find(...).select(...)
            .mockReturnValueOnce({ select: jest.fn().mockResolvedValue([mockBusiness]) });

        // 3. Ads to deactivate query
        (Ad.find as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: 'ad_1' }, { _id: 'ad_2' }]),
            }),
        });

        // 4. First call = business suspension, second call = ad deactivation
        (mutateStatusesBulk as jest.Mock)
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(2);

        await runSuspendExpiredBusinessesJob();

        expect(mutateStatusesBulk).toHaveBeenNthCalledWith(
            1,
            'business',
            ['biz123'],
            'suspended',
            expect.objectContaining({ id: 'cron_expireBusinesses' }),
            expect.any(String)
        );

        expect(mutateStatusesBulk).toHaveBeenNthCalledWith(
            2,
            'ad',
            ['ad_1', 'ad_2'],
            LISTING_STATUS.PENDING,
            expect.objectContaining({ id: 'cron_expireBusinesses' }),
            expect.any(String)
        );

        expect(Ad.find).toHaveBeenCalledWith(
            expect.objectContaining({
                sellerId: { $in: [mockUserId] },
                status: LISTING_STATUS.LIVE,
            })
        );
    });
});
