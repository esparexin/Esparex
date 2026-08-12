jest.mock("@esparex/core/models/Business", () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
        countDocuments: jest.fn(),
    },
}));

import Business from "@esparex/core/models/Business";
import { getBusinessOverview } from "@esparex/core/services/adminBusiness/business";

const mockBusiness = Business as any;

describe("getBusinessOverview", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("uses a single $facet aggregation pipeline filtering isDeleted: { $ne: true } for active metrics", async () => {
        const mockFacetOutput = [
            {
                total: [{ count: 6 }],
                live: [{ count: 6 }],
                pending: [],
                suspended: [],
                rejected: [],
                deleted: [{ count: 3 }],
                expiringSoon: [],
                expiringIn3Days: [],
            },
        ];

        mockBusiness.aggregate
            .mockResolvedValueOnce(mockFacetOutput)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        const overview = await getBusinessOverview();

        expect(mockBusiness.aggregate).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    $facet: expect.objectContaining({
                        total: expect.arrayContaining([
                            expect.objectContaining({ $match: { isDeleted: { $ne: true } } }),
                        ]),
                        live: expect.arrayContaining([
                            expect.objectContaining({ $match: { status: "live", isDeleted: { $ne: true } } }),
                        ]),
                    }),
                }),
            ])
        );

        expect(overview.total).toBe(6);
        expect(overview.live).toBe(6);
        expect(overview.pending).toBe(0);
        expect(overview.suspended).toBe(0);
        expect(overview.deleted).toBe(3);
    });
});
