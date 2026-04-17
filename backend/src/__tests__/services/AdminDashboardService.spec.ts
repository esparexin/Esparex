jest.mock("../../models/User", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn(), aggregate: jest.fn() },
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: { aggregate: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock("../../models/Report", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn() },
}));

jest.mock("../../models/Business", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn() },
}));

jest.mock("../../models/RevenueAnalytics", () => ({
    __esModule: true,
    default: { aggregate: jest.fn() },
}));

jest.mock("../../models/Model", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn() },
}));

jest.mock("../../models/ContactSubmission", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        countDocuments: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("../../models/AdminLog", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
    },
}));

jest.mock("../../models/Location", () => ({
    __esModule: true,
    default: { countDocuments: jest.fn(), find: jest.fn(), aggregate: jest.fn() },
}));

jest.mock("../../models/LocationAnalytics", () => ({
    __esModule: true,
    default: { find: jest.fn() },
}));

import Ad from "../../models/Ad";
import User from "../../models/User";
import Report from "../../models/Report";
import Business from "../../models/Business";
import RevenueAnalytics from "../../models/RevenueAnalytics";
import { getDashboardCardStats } from "../../services/AdminDashboardService";

const mockAd = Ad as unknown as { aggregate: jest.Mock };
const mockUser = User as unknown as { countDocuments: jest.Mock };
const mockReport = Report as unknown as { countDocuments: jest.Mock };
const mockBusiness = Business as unknown as { countDocuments: jest.Mock };
const mockRevenue = RevenueAnalytics as unknown as { aggregate: jest.Mock };

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

            const result = await getDashboardCardStats({});

            expect(result.totalUsers).toBe(0);
            expect(result.totalRevenueAgg).toEqual([]);
        });
    });
});
