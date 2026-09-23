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

describe('FeedQueryService - Listing Type & Location Flow Protection', () => {
    const validObjectId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        mockFindWithLimit.mockResolvedValue([
            { id: 'item-1', title: 'Item 1', listingType: 'ad', createdAt: new Date() },
            { id: 'item-2', title: 'Item 2', listingType: 'service', createdAt: new Date() },
            { id: 'item-3', title: 'Item 3', listingType: 'spare_part', createdAt: new Date() },
            { id: 'item-4', title: 'Item 4', listingType: 'ad', createdAt: new Date() },
        ]);
        mockFindWithinRadius.mockResolvedValue([]);
        mockResolveCanonical.mockResolvedValue(null);
    });

    it('India + All: does not restrict listingType filter (allows Ads + Services + Spare Parts)', async () => {
        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'country',
                listingType: 'all',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBeUndefined();
        expect(calledFilter.listingType).toBeUndefined();
    });

    it('India + Devices (ad): restricts listingType to ad', async () => {
        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'country',
                listingType: 'ad',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBeUndefined();
        expect(calledFilter.listingType).toBe('ad');
    });

    it('India + Services: restricts listingType to service', async () => {
        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'country',
                listingType: 'service',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBeUndefined();
        expect(calledFilter.listingType).toBe('service');
    });

    it('India + Spare Parts: restricts listingType to spare_part', async () => {
        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'country',
                listingType: 'spare_part',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBeUndefined();
        expect(calledFilter.listingType).toBe('spare_part');
    });

    it('Specific location + All: scopes to locationId without restricting listingType', async () => {
        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'city',
                listingType: 'all',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBe(validObjectId);
        expect(calledFilter.listingType).toBeUndefined();
    });

    it('Specific location + Services: scopes to locationId AND restricts listingType to service', async () => {
        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'city',
                listingType: 'service',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBe(validObjectId);
        expect(calledFilter.listingType).toBe('service');
    });

    it('Specific location + Spare Parts: scopes to locationId AND restricts listingType to spare_part', async () => {
        await buildHomeFeed(
            {
                locationId: validObjectId,
                level: 'city',
                listingType: 'spare_part',
            },
            12,
            null
        );

        expect(mockFindWithLimit).toHaveBeenCalled();
        const calledFilter = (mockFindWithLimit.mock.calls[0] as Record<string, unknown>[])[0];
        expect(calledFilter.locationId).toBe(validObjectId);
        expect(calledFilter.listingType).toBe('spare_part');
    });
});

