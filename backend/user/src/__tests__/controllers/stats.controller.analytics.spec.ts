import { Request, Response } from 'express';
jest.mock('@core/models/AdminMetrics', () => ({
    AdminMetrics: { index: jest.fn() },
    default: { index: jest.fn() }
}));
jest.mock('@core/models/Ad', () => ({
    Ad: { index: jest.fn(), findOne: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() },
    default: { index: jest.fn(), findOne: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() }
}));

jest.mock('@core/services/ad/AdMetricsService');
jest.mock('@core/utils/controllerUtils');
jest.mock('@core/utils/respond', () => ({
    sendSuccessResponse: jest.fn((res, data) => res.status(200).json({ success: true, data })),
}));
jest.mock('@core/utils/errorResponse', () => ({
    sendErrorResponse: jest.fn((req, res, code, msg) => res.status(code).json({ success: false, error: msg })),
}));

// Use dynamic require to ensure mocks are in place before controller imports its dependencies
const statsController = require('../../controllers/listing/stats.controller');
const AdMetricsService = require('@core/services/ad/AdMetricsService');
const controllerUtils = require('@core/utils/controllerUtils');

const mockGetSellerListingStats = AdMetricsService.getSellerListingStats;
const mockGetAndVerifyOwnedListing = controllerUtils.getAndVerifyOwnedListing;

describe('stats.controller - Analytics & Stats', () => {
    describe('getMyListingStats', () => {
        it('returns listing stats for authenticated user', async () => {
            const userId = 'user-123';
            const mockStats = { ad: { total: 5, live: 3 }, service: { total: 0 } };
            mockGetSellerListingStats.mockResolvedValue(mockStats);

            const req = {
                user: { _id: userId, toString: () => userId }
            } as unknown as Request;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as unknown as Response;

            await statsController.getMyListingStats(req, res);

            expect(mockGetSellerListingStats).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: mockStats
            }));
        });

        it('returns 401 if user is not in request', async () => {
            const req = {} as unknown as Request;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as unknown as Response;

            await statsController.getMyListingStats(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Unauthorized'
            }));
        });

        it('returns 500 if service fails', async () => {
            mockGetSellerListingStats.mockRejectedValue(new Error('DB error'));

            const req = {
                user: { _id: 'user-123' }
            } as unknown as Request;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as unknown as Response;

            await statsController.getMyListingStats(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getListingAnalytics', () => {
        it('returns view analytics for a verified owned listing', async () => {
            const mockListing = {
                _id: 'listing-456',
                views: { total: 100, unique: 80 }
            };
            mockGetAndVerifyOwnedListing.mockResolvedValue(mockListing);

            const req = { params: { id: 'listing-456' } } as unknown as Request;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as unknown as Response;

            await statsController.getListingAnalytics(req, res);

            expect(mockGetAndVerifyOwnedListing).toHaveBeenCalledWith(req, res, { select: 'views' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: {
                    id: 'listing-456',
                    views: { total: 100, unique: 80 }
                }
            }));
        });

        it('returns 500 if analytics retrieval fails', async () => {
            mockGetAndVerifyOwnedListing.mockRejectedValue(new Error('Verification failed'));

            const req = { params: { id: 'listing-456' } } as unknown as Request;
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as unknown as Response;

            await statsController.getListingAnalytics(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
