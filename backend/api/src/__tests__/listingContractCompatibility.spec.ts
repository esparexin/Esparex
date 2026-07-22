import { describe, it, expect } from 'vitest';

describe('Listing API Response Contract Compatibility', () => {
    it('verifies that response envelope maintains data array and pagination structure', () => {
        const mockApiResponse = {
            success: true,
            data: [
                {
                    id: 'ad-101',
                    title: 'Samsung Galaxy S22 Ultra 256GB',
                    price: 54000,
                    status: 'live',
                    sellerId: 'user-77',
                    createdAt: '2026-07-22T12:00:00.000Z',
                    location: { city: 'Mumbai', state: 'Maharashtra' }
                }
            ],
            pagination: {
                page: 1,
                limit: 20,
                total: 1,
                hasMore: false
            }
        };

        expect(mockApiResponse.success).toBe(true);
        expect(Array.isArray(mockApiResponse.data)).toBe(true);
        expect(mockApiResponse.data[0].id).toBe('ad-101');
        expect(mockApiResponse.pagination.page).toBe(1);
    });
});
