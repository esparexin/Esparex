import mongoose from 'mongoose';

const mockFindWithLimit = jest.fn();
const mockFindWithinRadius = jest.fn();
const mockListingRepository = {
    findWithLimit: mockFindWithLimit,
    findWithinRadius: mockFindWithinRadius,
};

jest.mock('../../composition/listings', () => ({
    getListingRepository: () => mockListingRepository,
}));

const mockResolveCanonical = jest.fn();
jest.mock('../../services/location/LocationQueryService', () => ({
    resolveCanonicalLocationForQuery: (...args: unknown[]) => mockResolveCanonical(...args),
}));

jest.mock('../../models/Boost', () => ({
    find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([]),
                }),
            }),
        }),
    }),
}));

jest.mock('../../models/Category', () => ({
    findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
        }),
    }),
}));

import { buildHomeFeed } from '../../domains/discovery/application/services/feed/FeedQueryService';

describe('FeedQueryService - Country Level Query Guard', () => {
    const validObjectId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        mockFindWithLimit.mockResolvedValue([]);
        mockFindWithinRadius.mockResolvedValue([]);
        mockResolveCanonical.mockResolvedValue(null);
    });

    it('does not set locationId filter when input.level is country', async () => {
        mockFindWithLimit.mockResolvedValue([
            { id: 'ad-1', title: 'Ad 1', createdAt: new Date() },
            { id: 'ad-2', title: 'Ad 2', createdAt: new Date() },
            { id: 'ad-3', title: 'Ad 3', createdAt: new Date() },
            { id: 'ad-4', title: 'Ad 4', createdAt: new Date() },
        ]);

        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'country',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBeUndefined();
    });

    it('does not set locationId filter when canonical location resolves to country level', async () => {
        mockResolveCanonical.mockResolvedValue({
            level: 'country',
            name: 'India',
        });

        mockFindWithLimit.mockResolvedValue([
            { id: 'ad-1', title: 'Ad 1', createdAt: new Date() },
            { id: 'ad-2', title: 'Ad 2', createdAt: new Date() },
            { id: 'ad-3', title: 'Ad 3', createdAt: new Date() },
            { id: 'ad-4', title: 'Ad 4', createdAt: new Date() },
        ]);

        await buildHomeFeed(
            {
                locationId: validObjectId,
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBeUndefined();
    });

    it('sets locationId filter when level is city', async () => {
        mockResolveCanonical.mockResolvedValue({
            level: 'city',
            name: 'Hyderabad',
        });

        mockFindWithLimit.mockResolvedValue([
            { id: 'ad-1', title: 'Ad 1', createdAt: new Date() },
            { id: 'ad-2', title: 'Ad 2', createdAt: new Date() },
            { id: 'ad-3', title: 'Ad 3', createdAt: new Date() },
            { id: 'ad-4', title: 'Ad 4', createdAt: new Date() },
        ]);

        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'city',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBe(validObjectId);
    });
});
