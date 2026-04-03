jest.mock("../../services/AdService", () => ({
    __esModule: true,
    getAds: jest.fn(),
}));

import { getSparePartListings } from "../../controllers/sparePartListingController";
import * as adService from "../../services/AdService";

describe("sparePartListingController pagination envelope", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns a standardized pagination envelope for public spare-part browse", async () => {
        const mockedGetAds = adService.getAds as jest.Mock;
        mockedGetAds.mockResolvedValueOnce({
            data: [{ id: "part-1", title: "iPhone screen" }],
            pagination: { page: 2, limit: 20, total: 45, hasMore: true, totalPages: 3 },
        });

        const req = {
            query: {
                page: "2",
                limit: "20",
            },
        } as any;

        const res = {
            json: jest.fn(),
        } as any;

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
