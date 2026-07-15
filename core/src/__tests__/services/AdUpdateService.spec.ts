import mongoose from 'mongoose';
import { LISTING_STATUS } from '@esparex/shared';
import { AdContext } from '../../types/ad.types';

// Mock models and services using the canonical paths
jest.mock('@esparex/core/composition/listings', () => ({
    getListingRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
            id: 'ad_1',
            status: 'active',
            listingType: 'ad',
            sellerId: 'user-123',
            title: 'Old Title',
            description: 'Old Description',
            price: 100,
            images: [],
            currency: 'USD'
        }),
        updateOne: jest.fn().mockResolvedValue({
            id: 'ad_1',
            status: 'active',
            listingType: 'ad'
        }),
        updateOneByFilter: jest.fn().mockResolvedValue({
            id: 'ad_1',
            status: 'active',
            listingType: 'ad'
        }),
        find: jest.fn().mockResolvedValue([]),
        insert: jest.fn(),
        updateMany: jest.fn()
    }),
    getListingUnitOfWork: jest.fn().mockReturnValue({
        executeTransaction: jest.fn().mockImplementation((work) => work('mock-session'))
    }),
    getListingsCache: jest.fn().mockReturnValue({
        invalidateAdFeedCaches: jest.fn().mockResolvedValue(undefined),
        invalidatePublicAdCache: jest.fn().mockResolvedValue(undefined)
    })
}));

jest.mock('@esparex/core/models/Ad', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock('@esparex/core/models/User', () => ({
    __esModule: true,
    default: {
        findById: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({ isSuspended: false }),
            }),
        }),
    },
}));

jest.mock('@esparex/core/models/SavedAd', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        }),
    },
}));

jest.mock('../../config/db', () => ({
    getUserConnection: jest.fn().mockReturnValue({
        models: {},
        model: jest.fn(),
        startSession: jest.fn().mockResolvedValue({
            withTransaction: jest.fn().mockImplementation((cb) => cb()),
            endSession: jest.fn(),
        }),
    }),
    getAdminConnection: jest.fn().mockReturnValue({
        models: {},
        model: jest.fn(),
        startSession: jest.fn().mockResolvedValue({
            withTransaction: jest.fn().mockImplementation((cb) => cb()),
            endSession: jest.fn(),
        }),
    }),
}));

jest.mock('../../services/AdCreationService', () => ({
    AdCreationService: {
        preparePayload: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    },
}));

jest.mock('../../services/lifecycle/StatusMutationService', () => ({
    mutateStatus: jest.fn(),
}));

jest.mock('../../queues/imageQueue', () => ({
    enqueueImageOptimization: jest.fn().mockResolvedValue(undefined),
}));

import Ad from '../../models/Ad';
import * as StatusMutationService from '../../services/lifecycle/StatusMutationService';
import { updateAdLogic } from '../../services/ad/AdUpdateService';
import { getListingRepository } from '@esparex/core/composition/listings';

const mockedAdModel = Ad as unknown as { findById: jest.Mock; findByIdAndUpdate: jest.Mock };
const mockRepo = getListingRepository() as jest.Mocked<ReturnType<typeof getListingRepository>>;

describe('AdUpdateService', () => {
    let mockAd: any;
    let context: AdContext;
    const mockId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockAd = {
            _id: mockId,
            sellerId: 'user-123',
            title: 'Old Title',
            description: 'Old Description',
            price: 1000,
            images: ['img1.jpg', 'img2.jpg'],
            status: 'live',
            toObject: jest.fn().mockReturnValue({
                title: 'Old Title',
                description: 'Old Description',
                price: 1000,
                images: ['img1.jpg', 'img2.jpg'],
            }),
        };

        context = {
            actor: 'USER',
            sellerId: 'user-123',
            authUserId: 'user-123',
        } as AdContext;

        mockedAdModel.findById.mockReturnValue({
            session: jest.fn().mockResolvedValue(mockAd),
        });
        
        mockRepo.updateOne.mockResolvedValue({
            ...mockAd,
            toObject: jest.fn().mockReturnValue({ ...mockAd }),
        });
        mockRepo.findOne.mockResolvedValue(mockAd);
    });

    describe('updateAdLogic', () => {
        it('should perform a non-sensitive update without status change', async () => {
            const updateData = { price: 1000 }; // Same price
            
            const result = await updateAdLogic(mockId, updateData, context);

            expect(result).toBeDefined();
            expect(StatusMutationService.mutateStatus).not.toHaveBeenCalled();
            expect(mockRepo.updateOne).toHaveBeenCalled();
        });

        it('should trigger re-review (PENDING status) for sensitive title change', async () => {
            const updateData = { title: 'New Title' };
            
            mockRepo.updateOne.mockResolvedValue({
                ...mockAd,
                title: 'New Title',
                toObject: jest.fn().mockReturnValue({ ...mockAd, title: 'New Title' }),
            });

            await updateAdLogic(mockId, updateData, context);

            expect(StatusMutationService.mutateStatus).toHaveBeenCalledWith(
                expect.objectContaining({
                    toStatus: LISTING_STATUS.PENDING,
                    reason: expect.stringContaining('review after edit'),
                })
            );
        });

        it('should trigger re-review for image changes', async () => {
            const updateData = { images: ['img1.jpg', 'img3.jpg'] }; // Changed img2 to img3
            
            mockRepo.updateOne.mockResolvedValue({
                ...mockAd,
                images: ['img1.jpg', 'img3.jpg'],
                toObject: jest.fn().mockReturnValue({ ...mockAd, images: ['img1.jpg', 'img3.jpg'] }),
            });

            await updateAdLogic(mockId, updateData, context);

            expect(StatusMutationService.mutateStatus).toHaveBeenCalled();
        });

        it('should trigger re-review for sensitive price change and detect price drop', async () => {
            const updateData = { price: 800 }; // Dropped from 1000
            
            mockRepo.updateOne.mockResolvedValue({
                ...mockAd,
                price: 800,
                toObject: jest.fn().mockReturnValue({ ...mockAd, price: 800 }),
            });

            await updateAdLogic(mockId, updateData, context);

            expect(StatusMutationService.mutateStatus).toHaveBeenCalled();
        });

        it('should prevent editing SOLD listings', async () => {
            mockAd.status = 'sold';
            
            await expect(updateAdLogic(mockId, { title: 'New' }, context))
                .rejects.toThrow('This ad can no longer be edited');
        });

        it('should prevent editing other users listings', async () => {
            context.sellerId = 'wrong-user';
            
            await expect(updateAdLogic(mockId, { title: 'New' }, context))
                .rejects.toThrow('Unauthorized');
        });
    });
});
