import { MongoListingRepositoryAdapter } from '../../../../../adapters/outbound/database/listings/MongoListingRepositoryAdapter';
import AdModel from '../../../../../models/Ad';
import { ListingFilter } from '../../../../../domains/listings';
import mongoose from 'mongoose';

jest.mock('../../../../../models/Ad', () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn().mockResolvedValue(0),
    }
}));

describe('MongoListingRepositoryAdapter', () => {
    let adapter: MongoListingRepositoryAdapter;

    beforeEach(() => {
        adapter = new MongoListingRepositoryAdapter();
        jest.clearAllMocks();
    });

    describe('ListingFilter to MongoFilter mapping', () => {
        it('should map all standard ListingFilter properties to mongo filter correctly', async () => {
            const mockId = new mongoose.Types.ObjectId().toString();
            
            const filter: ListingFilter = {
                sellerId: mockId,
                listingType: 'ad',
                status: 'live',
                categoryId: mockId,
                brandId: mockId,
                modelId: mockId,
                duplicateFingerprint: '1234567890abcdef',
                isDeleted: { $ne: true },
                isSold: false,
                locationId: mockId,
                locationCity: 'New York',
                locationState: 'NY',
                locationPath: mockId,
                isSpotlight: true,
                sparePartIds: mockId,
                favoritesGreaterThan: 10,
                moderationStatus: 'approved',
            };

            await adapter.count(filter);

            const expectedCall = expect.objectContaining({
                sellerId: new mongoose.Types.ObjectId(mockId),
                listingType: 'ad',
                status: 'live',
                categoryId: new mongoose.Types.ObjectId(mockId),
                brandId: new mongoose.Types.ObjectId(mockId),
                modelId: new mongoose.Types.ObjectId(mockId),
                duplicateFingerprint: '1234567890abcdef',
                isDeleted: { $ne: true },
                isSold: false,
                'location.locationId': new mongoose.Types.ObjectId(mockId),
                'location.city': 'New York',
                'location.state': 'NY',
                locationPath: new mongoose.Types.ObjectId(mockId),
                isSpotlight: true,
                sparePartIds: new mongoose.Types.ObjectId(mockId),
                'views.favorites': { $gt: 10 },
                moderationStatus: 'approved',
            });

            expect(AdModel.countDocuments).toHaveBeenCalledWith(expectedCall);
        });

        it('should correctly map array-based ID filters and exclusion filters', async () => {
            const mockId1 = new mongoose.Types.ObjectId().toString();
            const mockId2 = new mongoose.Types.ObjectId().toString();
            
            const filter: ListingFilter = {
                ids: [mockId1],
                idsNotIn: [mockId2],
                excludeStatus: ['deleted'],
            };

            await adapter.count(filter);

            expect(AdModel.countDocuments).toHaveBeenCalledWith(expect.objectContaining({
                _id: {
                    $in: [new mongoose.Types.ObjectId(mockId1)],
                    $nin: [new mongoose.Types.ObjectId(mockId2)]
                },
                status: {
                    $nin: ['deleted']
                }
            }));
        });

        it('should correctly map price range, imageHashes, sellerId operator, _id operator, and location.locationId string key', async () => {
            const mockId = new mongoose.Types.ObjectId().toString();
            const filter: ListingFilter = {
                _id: { $ne: mockId },
                sellerId: { $ne: mockId },
                price: { $gte: 100, $lte: 200 },
                imageHashes: { $in: ['hash1', 'hash2'] },
                'location.locationId': mockId,
            };

            await adapter.count(filter);

            expect(AdModel.countDocuments).toHaveBeenCalledWith(expect.objectContaining({
                _id: { $ne: mockId },
                sellerId: { $ne: mockId },
                price: { $gte: 100, $lte: 200 },
                imageHashes: { $in: ['hash1', 'hash2'] },
                'location.locationId': new mongoose.Types.ObjectId(mockId),
            }));
        });
    });
});
