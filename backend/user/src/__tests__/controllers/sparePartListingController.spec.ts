jest.mock("@esparex/core/services/ad/AdAggregationService", () => ({
    __esModule: true,
    getAds: jest.fn(),
}));

jest.mock("@esparex/core/utils/respond", () => ({
    respond: jest.fn((data: unknown) => data),
}));

import type { Request, Response } from "express";
import { getListings } from "../../controllers/listing/getListings.controller";
import * as AdAggregationService from "@esparex/core/services/ad/AdAggregationService";

describe("getListings.controller spare-part discovery", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns a standardized pagination envelope for public spare-part browse via unified getListings", async () => {
        const mockedGetAds = AdAggregationService.getAds as jest.Mock;
        mockedGetAds.mockResolvedValueOnce({
            data: [{ id: "part-1", title: "iPhone screen" }],
            pagination: { page: 2, limit: 20, total: 45, hasMore: true, totalPages: 3 },
        });

        const req = {
            query: {
                page: "2",
                limit: "20",
                listingType: "spare_part"
            },
        } as unknown as Request;

        const res = {
            json: jest.fn(),
        } as unknown as Response;

        const next = jest.fn();

        await getListings(req, res, next);

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
        
        expect(mockedGetAds).toHaveBeenCalledWith(
            expect.objectContaining({
                listingType: "spare_part"
            }),
            expect.any(Object),
            expect.any(Object)
        );
    });
});
