import { assessCrossUserDuplicateRisk, findExistingSelfDuplicate } from '../../domains/listings/application/ad/AdDuplicateService';
import { getListingRepository } from '../../composition/listings';
import mongoose from 'mongoose';

jest.mock('../../composition/listings', () => ({
    getListingRepository: jest.fn(),
}));

describe('AdDuplicateService', () => {
    const mockRepo = {
        findOne: jest.fn(),
        findWithLimit: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getListingRepository as jest.Mock).mockReturnValue(mockRepo);
    });

    describe('findExistingSelfDuplicate', () => {
        it('should query listing repository with canonical locationId and price range', async () => {
            const sellerId = new mongoose.Types.ObjectId().toString();
            const categoryId = new mongoose.Types.ObjectId().toString();
            const locationId = new mongoose.Types.ObjectId().toString();

            mockRepo.findOne.mockResolvedValue({ id: 'ad-123', status: 'live' });

            const result = await findExistingSelfDuplicate(
                sellerId,
                categoryId,
                locationId,
                1000
            );

            expect(result).toEqual({ id: 'ad-123', status: 'live' });
            expect(mockRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
                sellerId,
                categoryId,
                locationId,
                listingType: 'ad',
                price: { $gte: 900, $lte: 1100 },
                status: { $in: ['live', 'pending'] },
                isDeleted: { $ne: true }
            }));
        });

        it('should return null when locationId is missing', async () => {
            const result = await findExistingSelfDuplicate(
                'seller-1',
                'cat-1',
                undefined
            );
            expect(result).toBeNull();
            expect(mockRepo.findOne).not.toHaveBeenCalled();
        });
    });

    describe('assessCrossUserDuplicateRisk', () => {
        it('should query cross-user duplicates using sellerId exclusion, imageHashes, and price range', async () => {
            const sellerId = new mongoose.Types.ObjectId().toString();
            const categoryId = new mongoose.Types.ObjectId().toString();
            const locationId = new mongoose.Types.ObjectId().toString();

            mockRepo.findWithLimit.mockResolvedValue([
                { id: 'match-123', status: 'live' }
            ]);

            const payload = {
                categoryId,
                location: { locationId },
                price: 500,
            };

            const result = await assessCrossUserDuplicateRisk(
                payload,
                sellerId,
                ['hash-abc', 'hash-def']
            );

            expect(result.matchedAdId).toBe('match-123');
            expect(result.score).toBe(80);
            expect(mockRepo.findWithLimit).toHaveBeenCalledWith(
                expect.objectContaining({
                    categoryId,
                    locationId,
                    price: { $gte: 450, $lte: 550 },
                    sellerId: { $ne: sellerId },
                    imageHashes: { $in: ['hash-abc', 'hash-def'] },
                    status: { $in: ['live', 'pending'] }
                }),
                { createdAt: -1 },
                5
            );
        });

        it('should return score 0 when no cross-user listings match', async () => {
            mockRepo.findWithLimit.mockResolvedValue([]);

            const result = await assessCrossUserDuplicateRisk(
                {
                    categoryId: new mongoose.Types.ObjectId().toString(),
                    location: { locationId: new mongoose.Types.ObjectId().toString() },
                    price: 500
                },
                'seller-123',
                ['hash-unique']
            );

            expect(result.score).toBe(0);
            expect(result.matchedAdId).toBeUndefined();
        });
    });
});
