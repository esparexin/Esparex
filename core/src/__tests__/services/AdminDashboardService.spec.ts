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

import { REPORT_STATUS } from "@esparex/contracts";
import Ad from "../../models/Ad";
import User from "../../models/User";
import Report from "../../models/Report";
import Business from "../../models/Business";
import RevenueAnalytics from "../../models/RevenueAnalytics";
import CatalogModel from "../../models/Model";
import CatalogRequest from "../../models/CatalogRequest";
import { getDashboardOverviewStats } from "../../services/AdminDashboardService";

const mockAd = jest.mocked(Ad);
const mockUser = jest.mocked(User);
const mockReport = jest.mocked(Report);
const mockBusiness = jest.mocked(Business);
const mockRevenue = jest.mocked(RevenueAnalytics);
const mockModel = jest.mocked(CatalogModel);
const mockCatalogRequest = jest.mocked(CatalogRequest);

describe("AdminDashboardService", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("getDashboardOverviewStats", () => {
        it("returns correctly shaped overview stats from parallel model queries", async () => {
            mockUser.countDocuments.mockResolvedValue(100 as never);
            mockAd.aggregate.mockResolvedValue([
                {
                    totalAds: [{ count: 50 }],
                    activeAds: [{ count: 42 }],
                    pendingAds: [{ count: 8 }],
                    totalServices: [{ count: 10 }],
                    activeServices: [{ count: 7 }],
                    pendingServices: [{ count: 3 }],
                    rejectedServices: [{ count: 0 }],
                    totalSpareParts: [{ count: 5 }],
                    activeSpareParts: [{ count: 4 }],
                    pendingSpareParts: [{ count: 1 }]
                },
            ] as never);
            mockModel.countDocuments.mockResolvedValue(3 as never);
            mockReport.countDocuments.mockResolvedValue(10 as never);
            mockBusiness.countDocuments.mockResolvedValue(12 as never);
            mockRevenue.aggregate.mockResolvedValue([{ _id: null, total: 99999 }] as never);
            mockCatalogRequest.aggregate
                .mockResolvedValueOnce([{ _id: "pending", count: 2 }] as never)
                .mockResolvedValueOnce([{ _id: null, avgTimeMs: 7200000 }] as never);

            const result = await getDashboardOverviewStats({});

            expect(result.totalUsers).toBe(100);
            expect(result.openReports).toBe(10);
            expect(result.pendingModels).toBe(3);
            expect(result.pendingBusinesses).toBe(12);
            expect(result.totalRevenueAgg).toEqual([{ _id: null, total: 99999 }]);
            expect(result.catalogHealth).toEqual({
                pendingRequests: 2,
                averageResolutionHours: 2,
                mergedRequests: 0,
            });

            // Verify Report.countDocuments query does NOT contain phantom isDeleted predicate
            expect(mockReport.countDocuments).toHaveBeenCalledWith({
                status: REPORT_STATUS.OPEN,
            });
        });

        it("handles empty aggregation results gracefully", async () => {
            mockUser.countDocuments.mockResolvedValue(0 as never);
            mockAd.aggregate.mockResolvedValue([
                {
                    totalAds: [],
                    activeAds: [],
                    pendingAds: [],
                    totalServices: [],
                    activeServices: [],
                    pendingServices: [],
                    rejectedServices: [],
                    totalSpareParts: [],
                    activeSpareParts: [],
                    pendingSpareParts: []
                },
            ] as never);
            mockModel.countDocuments.mockResolvedValue(0 as never);
            mockReport.countDocuments.mockResolvedValue(0 as never);
            mockBusiness.countDocuments.mockResolvedValue(0 as never);
            mockRevenue.aggregate.mockResolvedValue([] as never);
            mockCatalogRequest.aggregate
                .mockResolvedValueOnce([] as never)
                .mockResolvedValueOnce([] as never);

            const result = await getDashboardOverviewStats({});

            expect(result.totalUsers).toBe(0);
            expect(result.openReports).toBe(0);
            expect(result.totalRevenueAgg).toEqual([]);
            expect(result.catalogHealth).toEqual({
                pendingRequests: 0,
                averageResolutionHours: 0,
                mergedRequests: 0,
            });
        });
    });
});
