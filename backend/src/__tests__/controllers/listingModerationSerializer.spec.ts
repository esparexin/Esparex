import { serializeModerationListing } from '../../controllers/admin/listingModerationSerializer';

describe('listingModerationSerializer', () => {
    it('preserves valid listingType values', () => {
        const listing = serializeModerationListing({
            _id: 'abc123',
            status: 'live',
            listingType: 'service',
        });

        expect(listing.listingType).toBe('service');
        expect(listing.id).toBe('abc123');
    });

    it('throws on invalid listingType instead of coercing to ad', () => {
        expect(() => serializeModerationListing({
            _id: 'abc123',
            status: 'live',
            listingType: 'unknown',
        })).toThrow('missing/invalid listingType');
    });
});
