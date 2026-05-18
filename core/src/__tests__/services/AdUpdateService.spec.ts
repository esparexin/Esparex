import mongoose from 'mongoose';
import { updateAdLogic } from '../../services/ad/AdUpdateService';
import Ad from '../../models/Ad';
import { AdCreationService } from '../../services/AdCreationService';
import * as StatusMutationService from '../../services/StatusMutationService';
import * as s3Utils from '../../utils/s3';
import { LISTING_STATUS } from '../../constants/enums/listingStatus';

jest.mock('../../models/Ad');
jest.mock('../../services/AdCreationService');
jest.mock('../../services/StatusMutationService');
jest.mock('../../utils/s3');
jest.mock('../../config/db', () => ({
    getUserConnection: () => ({
        models: {},
        model: jest.fn().mockReturnValue({}),
        startSession: jest.fn().mockResolvedValue({
            withTransaction: jest.fn().mockImplementation(async (cb) => { await cb(); }),
            endSession: jest.fn(),
        }),
    }),
    getAdminConnection: () => ({
        models: {},
        model: jest.fn().mockReturnValue({}),
    }),
}));

describe('AdUpdateService', () => {
    let mockAd: any;
    const adId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();

        mockAd = {
            _id: adId,
            sellerId: userId,
            status: LISTING_STATUS.LIVE,
            title: 'Old Title',
            description: 'Old Description',
            price: 100,
            images: ['https://cdn.esparex.in/old1.jpg', 'https://cdn.esparex.in/old2.jpg'],
            toObject: jest.fn().mockReturnThis(),
        };

        (Ad.findById as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue(mockAd),
        });

        (Ad.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockAd);

        (AdCreationService.preparePayload as jest.Mock).mockImplementation(async (data) => ({
            ...mockAd,
            ...data,
        }));

        (StatusMutationService.mutateStatus as jest.Mock).mockResolvedValue(mockAd);
        (s3Utils.deleteFromS3Url as jest.Mock).mockResolvedValue(true);
    });

    it('blocks unauthorized edits', async () => {
        const context = { actor: 'USER' as const, authUserId: 'hacker', sellerId: 'hacker', allowSuspendedUser: true };
        await expect(updateAdLogic(adId, {}, context)).rejects.toThrow('Unauthorized: You can only edit your own ads');
    });

    it('preserves status for non-sensitive changes', async () => {
        const context = { actor: 'USER' as const, authUserId: userId, sellerId: userId, allowSuspendedUser: true };
        // Changing something non-sensitive like location details or categoryId (if permitted)
        await updateAdLogic(adId, { locationId: 'new-loc' }, context);
        
        expect(StatusMutationService.mutateStatus).not.toHaveBeenCalled();
    });

    it('triggers moderation re-review for title changes', async () => {
        const context = { actor: 'USER' as const, authUserId: userId, sellerId: userId, allowSuspendedUser: true };
        
        await updateAdLogic(adId, { title: 'New Sensitive Title' }, context);
        
        expect(StatusMutationService.mutateStatus).toHaveBeenCalledWith(expect.objectContaining({
            toStatus: LISTING_STATUS.PENDING,
            reason: 'Re-submitted for review after edit',
        }));
    });

    it('triggers moderation re-review for image changes', async () => {
        const context = { actor: 'USER' as const, authUserId: userId, sellerId: userId, allowSuspendedUser: true };
        
        await updateAdLogic(adId, { images: ['https://cdn.esparex.in/new.jpg'] }, context);
        
        expect(StatusMutationService.mutateStatus).toHaveBeenCalledWith(expect.objectContaining({
            toStatus: LISTING_STATUS.PENDING,
        }));
    });

    it('queues removed images for cleanup', async () => {
        const context = { actor: 'USER' as const, authUserId: userId, sellerId: userId, allowSuspendedUser: true };
        
        await updateAdLogic(adId, { images: ['https://cdn.esparex.in/old1.jpg', 'https://cdn.esparex.in/new.jpg'] }, context);
        
        // Let the async void closure execute
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(s3Utils.deleteFromS3Url).toHaveBeenCalledTimes(1);
        expect(s3Utils.deleteFromS3Url).toHaveBeenCalledWith('https://cdn.esparex.in/old2.jpg');
    });
});
