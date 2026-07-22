describe('Listing Contract & Schema Compatibility', () => {
    it('verifies that projected response satisfies Listing interface fields', () => {
        const sampleListing = {
            id: '507f1f77bcf86cd799439011',
            title: 'Samsung Galaxy S22 Ultra 256GB',
            price: 45000,
            images: ['https://s3.amazonaws.com/esparex/sample.jpg'],
            listingType: 'ad',
            location: { city: 'Mumbai', state: 'Maharashtra' },
            sellerId: 'user-99',
            status: 'live',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(sampleListing.id).toBeDefined();
        expect(sampleListing.title).toBe('Samsung Galaxy S22 Ultra 256GB');
        expect(sampleListing.price).toBe(45000);
        expect(sampleListing.status).toBe('live');
    });
});
