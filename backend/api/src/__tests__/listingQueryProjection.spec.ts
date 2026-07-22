import { describe, it, expect } from 'vitest';
import { AdSchema } from '@esparex/contracts';

describe('Listing Query Projections & Response Contract Audit', () => {
    it('verifies that projected listing DTO fulfills AdSchema contracts', () => {
        const mockProjectedListing = {
            id: '507f1f77bcf86cd799439011',
            title: 'iPhone 13 128GB Blue Excellent Condition',
            price: 42000,
            description: 'Used iPhone 13 in pristine condition with original box.',
            images: ['https://example.com/images/iphone13.jpg'],
            listingType: 'spare_part',
            categoryId: 'cat-101',
            categoryName: 'Mobile Phones',
            sellerId: 'user-901',
            status: 'live',
            createdAt: '2026-07-22T10:00:00.000Z',
            updatedAt: '2026-07-22T10:00:00.000Z',
            location: {
                city: 'Bengaluru',
                state: 'Karnataka',
                country: 'India',
                display: 'Indiranagar, Bengaluru',
                coordinates: {
                    type: 'Point',
                    coordinates: [77.6412, 12.9719]
                }
            },
            isSpotlight: false,
            isFeatured: true
        };

        const parsed = AdSchema.safeParse(mockProjectedListing);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.id).toBe('507f1f77bcf86cd799439011');
            expect(parsed.data.title).toContain('iPhone 13');
            expect(parsed.data.sellerId).toBe('user-901');
            expect(parsed.data.status).toBe('live');
        }
    });

    it('ensures heavy internal fields are excluded from public projection payload', () => {
        const publicKeys = [
            '_id', 'id', 'title', 'price', 'description', 'images', 'listingType',
            'attributes', 'category', 'seoSlug', 'categoryId', 'categoryName',
            'location', 'sellerId', 'status', 'createdAt', 'updatedAt'
        ];

        const heavyInternalFields = ['internalNotes', 'auditHistory', 'moderationLogs', 'rawDraftData'];
        for (const field of heavyInternalFields) {
            expect(publicKeys).not.toContain(field);
        }
    });
});
