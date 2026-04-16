jest.mock("../../services/ad/AdAggregationService", () => ({
    __esModule: true,
    getAds: jest.fn(),
}));

import type { Request, Response } from "express";
import { getSparePartListings } from "../../controllers/sparePartListing/sparePartListingController";
import * as AdAggregationService from "../../services/ad/AdAggregationService";

describe("sparePartListingController pagination envelope", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns a standardized pagination envelope for public spare-part browse", async () => {
        const mockedGetAds = AdAggregationService.getAds as jest.Mock;
        mockedGetAds.mockResolvedValueOnce({
            data: [{ id: "part-1", title: "iPhone screen" }],
            pagination: { page: 2, limit: 20, total: 45, hasMore: true, totalPages: 3 },
        });

        const req = {
            query: {
                page: "2",
                limit: "20",
            },
        } as unknown as Request;

        const res = {
            json: jest.fn(),
        } as unknown as Response;

        await getSparePartListings(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: [{ id: "part-1", title: "iPhone screen" }],
                pagination: expect.objectContaining({
                    page: 2,
                    limit: 20,
                    total: 45,
                    hasMore: true,
                    totalPages: 3,
                }),
            })
        );
    });
});
