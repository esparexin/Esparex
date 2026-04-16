jest.mock("../../services/ad/AdAggregationService", () => ({
    __esModule: true,
    getAds: jest.fn(),
}));

import type { Request, Response } from "express";
import { getServices } from "../../controllers/service/serviceQueryController";
import * as AdAggregationService from "../../services/ad/AdAggregationService";

describe("serviceQueryController location filters regression", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("passes locationId + level + radiusKm from query to ad service layer", async () => {
        const mockedGetAds = AdAggregationService.getAds as jest.Mock;
        mockedGetAds.mockResolvedValueOnce({
            data: [],
            pagination: { page: 1, limit: 20, total: 0, hasMore: false },
        });

        const req = {
            query: {
                locationId: "65f0a1b2c3d4e5f607182930",
                level: "district",
                radiusKm: "50",
                page: "1",
                limit: "20",
            },
        } as unknown as Request;

        const res = {
            json: jest.fn(),
        } as unknown as Response;

        await getServices(req, res);

        expect(mockedGetAds).toHaveBeenCalledWith(
            expect.objectContaining({
                listingType: 'service',
                locationId: "65f0a1b2c3d4e5f607182930",
                level: "district",
                radiusKm: 50, // Should be Number
            }),
            expect.any(Object),
            expect.any(Object)
        );
        expect(res.json).toHaveBeenCalled();
    });
});

