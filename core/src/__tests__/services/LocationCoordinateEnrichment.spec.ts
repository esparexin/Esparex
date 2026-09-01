import mongoose from 'mongoose';
import { resolveCanonicalLocationForQuery } from '../../services/location/LocationQueryService';
import { locationRepository } from '../../composition/location';

jest.mock('../../composition/location', () => ({
    locationRepository: {
        findById: jest.fn(),
        findOne: jest.fn(),
        findMany: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        }),
    },
}));

jest.mock('../../services/location/LocationCacheService', () => ({
    LocationCacheService: {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('Canonical Location Coordinate Enrichment for Proximity Discovery', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves coordinates and state for a canonical city location (e.g. Macherla)', async () => {
        const macherlaId = new mongoose.Types.ObjectId().toString();
        const macherlaDoc = {
            _id: new mongoose.Types.ObjectId(macherlaId),
            name: 'Macherla',
            level: 'city',
            state: 'Andhra Pradesh',
            country: 'India',
            coordinates: {
                type: 'Point',
                coordinates: [79.29, 16.48], // [lng, lat]
            },
            isActive: true,
            verificationStatus: 'verified',
        };

        (locationRepository.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(macherlaDoc),
            }),
        });

        const result = await resolveCanonicalLocationForQuery(macherlaId);

        expect(result).not.toBeNull();
        expect(result?.lat).toBe(16.48);
        expect(result?.lng).toBe(79.29);
        expect(result?.state).toBe('Andhra Pradesh');
        expect(result?.level).toBe('city');
    });

    it('does NOT set geospatial coordinates for state-level locations (preserves strict hierarchy)', async () => {
        const apId = new mongoose.Types.ObjectId().toString();
        const stateDoc = {
            _id: new mongoose.Types.ObjectId(apId),
            name: 'Andhra Pradesh',
            level: 'state',
            state: 'Andhra Pradesh',
            country: 'India',
            coordinates: {
                type: 'Point',
                coordinates: [80.5, 15.9],
            },
            isActive: true,
            verificationStatus: 'verified',
        };

        (locationRepository.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(stateDoc),
            }),
        });

        const result = await resolveCanonicalLocationForQuery(apId);

        expect(result).not.toBeNull();
        expect(result?.lat).toBeUndefined();
        expect(result?.lng).toBeUndefined();
        expect(result?.state).toBe('Andhra Pradesh');
        expect(result?.level).toBe('state');
    });

    it('does NOT set geospatial coordinates for country-level locations', async () => {
        const indiaId = new mongoose.Types.ObjectId().toString();
        const countryDoc = {
            _id: new mongoose.Types.ObjectId(indiaId),
            name: 'India',
            level: 'country',
            country: 'India',
            coordinates: {
                type: 'Point',
                coordinates: [78.96, 20.59],
            },
            isActive: true,
            verificationStatus: 'verified',
        };

        (locationRepository.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(countryDoc),
            }),
        });

        const result = await resolveCanonicalLocationForQuery(indiaId);

        expect(result).not.toBeNull();
        expect(result?.lat).toBeUndefined();
        expect(result?.lng).toBeUndefined();
        expect(result?.level).toBe('country');
    });

    it('returns null gracefully when location is not found in database', async () => {
        const randomId = new mongoose.Types.ObjectId().toString();

        (locationRepository.findById as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        });

        const result = await resolveCanonicalLocationForQuery(randomId);
        expect(result).toBeNull();
    });

    it('returns null for invalid or missing locationId formats without throwing', async () => {
        expect(await resolveCanonicalLocationForQuery(undefined)).toBeNull();
        expect(await resolveCanonicalLocationForQuery('')).toBeNull();
        expect(await resolveCanonicalLocationForQuery('invalid-id-format')).toBeNull();
    });
});
