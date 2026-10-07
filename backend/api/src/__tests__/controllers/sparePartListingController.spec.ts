const mockGetAds = jest.fn();

jest.mock('@esparex/core', () => ({
    ...jest.requireActual('@esparex/core'),
    AdAggregationService: {
        getAds: (...args: unknown[]) => mockGetAds(...args),
    },
}));

jest.mock("../../utils/respond", () => ({
    respond: jest.fn((data: unknown) => data),
}));

import type { Request, Response } from "express";
import { getListings } from "../../controllers/listing/getListings.controller";

describe("getListings.controller spare-part discovery", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns a standardized pagination envelope for public spare-part browse via unified getListings", async () => {
        mockGetAds.mockResolvedValueOnce({
            data: [{ id: "part-1", title: "iPhone screen" }],
            pagination: { page: 2, limit: 20, total: 45, hasMore: true, totalPages: 3 },
        });

        const req = {
            query: {
                page: "2",
                limit: "20",
                listingType: "spare_part"
            },
        } as any;

        const res = {
            json: jest.fn(),
        } as any;

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
        
        expect(mockGetAds).toHaveBeenCalledWith(
            expect.objectContaining({
                listingType: "spare_part"
            }),
            expect.any(Object),
            expect.any(Object)
        );
    });
});
