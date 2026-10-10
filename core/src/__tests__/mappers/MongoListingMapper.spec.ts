import { toDomain, PUBLIC_LISTING_PROJECTION, DbListing } from '../../domains/listings/mappers/MongoListingMapper';

describe('MongoListingMapper', () => {
    describe('PUBLIC_LISTING_PROJECTION', () => {
        it('includes presentation, category, and seller verification fields in projection', () => {
            expect(PUBLIC_LISTING_PROJECTION.categoryName).toBe(1);
            expect(PUBLIC_LISTING_PROJECTION.brandName).toBe(1);
            expect(PUBLIC_LISTING_PROJECTION.modelName).toBe(1);
            expect(PUBLIC_LISTING_PROJECTION.isBusiness).toBe(1);
            expect(PUBLIC_LISTING_PROJECTION.verified).toBe(1);
            expect(PUBLIC_LISTING_PROJECTION.businessName).toBe(1);
            expect(PUBLIC_LISTING_PROJECTION.sellerName).toBe(1);
            expect(PUBLIC_LISTING_PROJECTION.isSpotlight).toBe(1);
        });
    });

    describe('toDomain', () => {
        const baseDoc: DbListing = {
            _id: '507f1f77bcf86cd799439011',
            title: 'Test Listing',
            description: 'Test description',
            price: 1500,
            listingType: 'ad',
            sellerId: '507f1f77bcf86cd799439012',
            status: 'live',
            categoryId: '507f1f77bcf86cd799439013',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-02T00:00:00Z'),
        };

        it('maps presentation metadata and seller verification correctly', () => {
            const doc: DbListing = {
                ...baseDoc,
                categoryName: 'Smartphones',
                brandName: 'Apple',
                modelName: 'iPhone 13',
                sellerType: 'business',
                businessId: '507f1f77bcf86cd799439099',
                isBusiness: true,
                verified: true,
                businessName: 'iFix Tech',
                sellerName: 'John Doe',
                isBoosted: true,
                deviceCondition: 'power_on',
            };

            const domain = toDomain(doc);

            expect(domain.categoryName).toBe('Smartphones');
            expect(domain.brandName).toBe('Apple');
            expect(domain.modelName).toBe('iPhone 13');
            expect(domain.isBusiness).toBe(true);
            expect(domain.verified).toBe(true);
            expect(domain.businessName).toBe('iFix Tech');
            expect(domain.sellerName).toBe('John Doe');
            expect(domain.isBoosted).toBe(true);
            expect(domain.deviceCondition).toBe('power_on');
        });

        it('infers isBusiness: true when sellerType is business even without isBusiness flag', () => {
            const doc: DbListing = {
                ...baseDoc,
                sellerType: 'business',
                verified: false,
            };

            const domain = toDomain(doc);

            expect(domain.isBusiness).toBe(true);
            expect(domain.verified).toBe(false);
        });

        it('handles undefined optional metadata cleanly', () => {
            const domain = toDomain(baseDoc);

            expect(domain.categoryName).toBeUndefined();
            expect(domain.brandName).toBeUndefined();
            expect(domain.modelName).toBeUndefined();
            expect(domain.isBusiness).toBe(false);
            expect(domain.verified).toBe(false);
            expect(domain.businessName).toBeUndefined();
            expect(domain.sellerName).toBeUndefined();
            expect(domain.isBoosted).toBe(false);
        });
    });
});
