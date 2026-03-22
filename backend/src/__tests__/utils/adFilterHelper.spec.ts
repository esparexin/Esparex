import mongoose from 'mongoose';
import { buildAdFilterFromCriteria } from '../../utils/adFilterHelper';

describe('buildAdFilterFromCriteria location hierarchy guards', () => {
    it('keeps structured locationId filtering for region-level requests even when coordinates are present', () => {
        const locationId = new mongoose.Types.ObjectId().toHexString();

        const match = buildAdFilterFromCriteria({
            locationId,
            level: 'state',
            lat: 19.076,
            lng: 72.8777
        });

        expect(match.$or).toEqual([
            { locationPath: expect.any(mongoose.Types.ObjectId) },
            { 'location.locationId': expect.any(mongoose.Types.ObjectId) }
        ]);
    });

    it('uses geo-only strategy for non-region levels when coordinates are present', () => {
        const locationId = new mongoose.Types.ObjectId().toHexString();

        const match = buildAdFilterFromCriteria({
            locationId,
            level: 'city',
            lat: 12.9716,
            lng: 77.5946
        });

        expect(match.$or).toBeUndefined();
    });

    it('applies strict state matching for state-level fallback requests', () => {
        const match = buildAdFilterFromCriteria({
            level: 'state',
            location: 'Maharashtra'
        });

        expect(match['location.state']).toBe('Maharashtra');
    });

    it('applies strict country matching for country-level fallback requests', () => {
        const match = buildAdFilterFromCriteria({
            level: 'country',
            location: 'India'
        });

        expect(match['location.country']).toBe('India');
    });
});
