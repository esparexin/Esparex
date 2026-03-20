jest.mock("../../services/AdService", () => ({
    __esModule: true,
    getAds: jest.fn(),
}));

import { getServices } from "../../controllers/service/serviceQueryController";
import * as adService from "../../services/AdService";

describe("serviceQueryController location filters regression", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("passes locationId + level + radiusKm from query to ad service layer", async () => {
        const mockedGetAds = adService.getAds as jest.Mock;
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
        } as any;

        const res = {
            json: jest.fn(),
        } as any;

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

