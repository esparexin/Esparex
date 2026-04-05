import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdsPage, getMyAds, getMyListings, getMyListingsStats, deleteListing as deleteAd, repostListing } from "@/lib/api/user/listings";
import { apiClient } from '@/lib/api/client';
import { fetchUserApiJson } from '@/lib/api/user/server';
import { EsparexError, ErrorCategory, ErrorSeverity } from "@/lib/errorHandler";
import { LISTING_TYPE } from "@shared/enums/listingType";

// We mock the API Client since it's the layer right below our ads api service
vi.mock('@/lib/api/client', () => {
    return {
        apiClient: {
            get: vi.fn(),
            delete: vi.fn(),
            post: vi.fn()
        }
    };
});

vi.mock('@/lib/api/user/server', () => {
    return {
        fetchUserApiJson: vi.fn(),
    };
});

describe('MyAds API Regression Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchUserApiJson).mockReset();
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

        it('should route service deletes to the service endpoint', async () => {
            vi.mocked(apiClient.delete).mockResolvedValueOnce({
                success: true,
                data: null
            });

            const result = await deleteAd('svc-123', LISTING_TYPE.SERVICE);
            expect(result).toBe(true);
            expect(apiClient.delete).toHaveBeenCalledWith('services/svc-123', { silent: true });
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

    describe('Test 4 — Unified MyListings Payload', () => {
        it('should extract items from paginated data envelopes shaped as { items, pagination }', async () => {
            const fakeDate = new Date().toISOString();
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                success: true,
                data: {
                    items: [
                        { _id: 'ad-unified', title: 'iPhone 15', price: 75000, createdAt: fakeDate, status: 'live' }
                    ],
                    pagination: { page: 1, limit: 20, total: 1, hasMore: false }
                }
            });

            const result = await getMyListings('ad', 'live');
            expect(result.data).toHaveLength(1);
            expect(result.data[0]?.id).toBe('ad-unified');
            expect(result.pagination.total).toBe(1);
        });

        it('should route spare-part reposts to the spare-part endpoint', async () => {
            vi.mocked(apiClient.post as any).mockResolvedValueOnce({
                success: true,
                data: { ok: true }
            });

            const result = await repostListing('part-123', LISTING_TYPE.SPARE_PART);
            expect(result).toBe(true);
            expect(apiClient.post).toHaveBeenCalledWith(
                'spare-part-listings/part-123/repost',
                undefined,
                { silent: true }
            );
        });

        it('should load listing stats from the unified listings stats endpoint', async () => {
            vi.mocked(apiClient.get).mockResolvedValueOnce({
                success: true,
                data: {
                    ad: { live: 1, total: 1 },
                    service: { pending: 2, total: 2 },
                    spare_part: { total: 0 }
                }
            });

            const stats = await getMyListingsStats();
            expect(stats.ad?.live).toBe(1);
            expect(apiClient.get).toHaveBeenCalledWith('listings/mine/stats');
        });
    });

    describe('Test 5 — Public Browse Pagination', () => {
        it('should derive hasMore from total when the endpoint omits it in page mode', async () => {
            const fakeDate = new Date().toISOString();
            vi.mocked(fetchUserApiJson).mockResolvedValueOnce({
                success: true,
                data: [
                    { _id: 'ad-page-1', title: 'Samsung S24', price: 80000, createdAt: fakeDate, status: 'live' }
                ],
                pagination: { page: 1, limit: 20, total: 21 }
            });

            const result = await getAdsPage({ page: 1, limit: 20 });
            expect(result.pagination.hasMore).toBe(true);
            expect(result.pagination.total).toBe(21);
        });

        it('should read standardized nested pagination envelopes for browse endpoints', async () => {
            const fakeDate = new Date().toISOString();
            vi.mocked(fetchUserApiJson).mockResolvedValueOnce({
                success: true,
                data: {
                    items: [
                        { _id: 'part-xyz', title: 'Display Combo', price: 4500, createdAt: fakeDate, status: 'live' }
                    ],
                    pagination: { page: 1, limit: 20, total: 1, hasMore: false }
                }
            });

            const result = await getAdsPage({ page: 1, limit: 20 });
            expect(result.data).toHaveLength(1);
            expect(result.data[0]?.id).toBe('part-xyz');
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.hasMore).toBe(false);
        });
    });
});
