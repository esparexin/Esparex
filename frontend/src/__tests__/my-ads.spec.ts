import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMyAds, deleteAd } from '@/api/user/ads';
import { apiClient } from '@/lib/api/client';
import { EsparexError, ErrorCategory, ErrorSeverity } from '@/utils/errorHandler';

// We mock the API Client since it's the layer right below our ads api service
vi.mock('@/lib/api/client', () => {
    return {
        apiClient: {
            get: vi.fn(),
            delete: vi.fn()
        }
    };
});

describe('MyAds API Regression Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Test 1 — MyAds Unauthorized', () => {
        it('should surface correctly structured error instead of hiding behind generic MyAds response', async () => {
            const networkError = new EsparexError({
                code: 5001,
                category: ErrorCategory.NETWORK,
                severity: ErrorSeverity.MEDIUM,
                userMessage: 'Unauthorized',
                technicalMessage: 'Unauthorized test error',
                context: { statusCode: 401 }
            });

            vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

            await expect(getMyAds()).rejects.toThrow('MyAds API error: 401');
        });
    });

    describe('Test 2 — Delete Success', () => {
        it('should consider delete successful when API returns success:true with data:null', async () => {
            // Simulate the backend HTTP response resolution structure handled by interceptors mapping to `apiClient` return
            vi.mocked(apiClient.delete).mockResolvedValueOnce({
                success: true,
                data: null
            });

            const result = await deleteAd('ad-123');
            expect(result).toBe(true);
        });
    });

    describe('Test 3 — MyAds Payload', () => {
        it('should extract ads successfully from wrapped shape payload', async () => {
            const fakeDate = new Date().toISOString();
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                success: true,
                data: [
                    { _id: 'ad-xyz', title: 'Macbook', price: 1500, createdAt: fakeDate }
                ],
                pagination: { page: 1, limit: 10 }
            });

            const ads = await getMyAds();
            expect(ads).toHaveLength(1);
            expect(ads[0]?.id).toBe('ad-xyz');
            expect(ads[0]?.title).toBe('Macbook');
        });
    });
});
