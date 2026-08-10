jest.mock("@esparex/core/models/User", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn(), aggregate: jest.fn() },
}));

jest.mock("@esparex/core/models/Ad", () => ({
    __esModule: true,
    default: { aggregate: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock("@esparex/core/models/Report", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn() },
}));

jest.mock("@esparex/core/models/Business", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn() },
}));

jest.mock("@esparex/core/models/RevenueAnalytics", () => ({
    __esModule: true,
    default: { aggregate: jest.fn() },
}));

jest.mock("@esparex/core/models/Model", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn() },
}));

jest.mock("@esparex/core/models/ContactSubmission", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        countDocuments: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/CatalogRequest", () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/AdminLog", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/Location", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn(), find: jest.fn(), aggregate: jest.fn() },
}));

jest.mock("@esparex/core/models/LocationAnalytics", () => ({
    __esModule: true,
    default: { find: jest.fn() },
}));

import Ad from "../../models/Ad";
import User from "../../models/User";
import Report from "../../models/Report";
import Business from "../../models/Business";
import RevenueAnalytics from "../../models/RevenueAnalytics";
import CatalogRequest from "../../models/CatalogRequest";
import { getDashboardCardStats } from "../../services/AdminDashboardService";

const mockAd = Ad as any;
const mockUser = User as any;
const mockReport = Report as any;
const mockBusiness = Business as any;
const mockRevenue = RevenueAnalytics as any;
const mockCatalogRequest = CatalogRequest as any;

describe("AdminDashboardService", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("getDashboardCardStats", () => {
        it("returns correctly shaped stats from parallel model queries", async () => {
            mockUser.countDocuments.mockResolvedValue(100);
            mockAd.aggregate.mockResolvedValue([
                {
                    live: [{ count: 42 }],
                    pending: [{ count: 7 }],
                },
            ]);
            mockReport.countDocuments.mockResolvedValue(5);
            mockBusiness.countDocuments.mockResolvedValue(12);
            mockRevenue.aggregate.mockResolvedValue([{ _id: null, total: 99999 }]);
            mockCatalogRequest.aggregate.mockResolvedValue([]);
            mockAd.countDocuments.mockResolvedValue(0);

            const result = await getDashboardCardStats({});

            expect(result.totalUsers).toBe(100);
            expect(result.totalReports).toBe(5);
            expect(result.totalBusinesses).toBe(12);
            expect(result.totalRevenueAgg).toEqual([{ _id: null, total: 99999 }]);
            expect(result.adStats).toEqual([
                { live: [{ count: 42 }], pending: [{ count: 7 }] },
            ]);
        });

        it("handles empty aggregation gracefully (no ads, no revenue)", async () => {
            mockUser.countDocuments.mockResolvedValue(0);
            mockAd.aggregate.mockResolvedValue([{ live: [], pending: [] }]);
            mockReport.countDocuments.mockResolvedValue(0);
            mockBusiness.countDocuments.mockResolvedValue(0);
            mockRevenue.aggregate.mockResolvedValue([]);
            mockCatalogRequest.aggregate.mockResolvedValue([]);
            mockAd.countDocuments.mockResolvedValue(0);

            const result = await getDashboardCardStats({});

            expect(result.totalUsers).toBe(0);
            expect(result.totalRevenueAgg).toEqual([]);
        });
    });
});
