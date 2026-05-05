jest.mock("@esparex/core/models/Report", () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/Ad", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/User", () => ({
    __esModule: true,
    default: {
        exists: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/Business", () => ({
    __esModule: true,
    default: {
        exists: jest.fn(),
    },
}));

jest.mock("@esparex/core/utils/redisCache", () => ({
    __esModule: true,
    invalidateAdFeedCaches: jest.fn().mockResolvedValue(undefined),
    invalidatePublicAdCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@esparex/core/utils/logger", () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
    },
}));
jest.mock("@esparex/core/services/StatusMutationService", () => ({
    __esModule: true,
    mutateStatus: jest.fn().mockResolvedValue(undefined),
}));

import mongoose from "mongoose";
import { mutateStatus } from "../../services/StatusMutationService";
import {
    findReportForUpdate,
    autoHideAdIfOverThreshold,
    countActiveReports,
} from "../../services/ReportService";
const mockedMutateStatus = mutateStatus as jest.Mock;

import mockReportRaw from "../../models/Report";

describe("ReportService", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("findReportForUpdate", () => {
        it("returns null when report not found", async () => {
            const mockReport = mockReportRaw as unknown as {
                findById: jest.Mock;
            };
            mockReport.findById.mockResolvedValue(null);
            const result = await findReportForUpdate("nonexistent_id");
            expect(result).toBeNull();
        });

        it("returns the report document when found", async () => {
            const mockReport = mockReportRaw as unknown as {
                findById: jest.Mock;
            };
            const fakeReport = { _id: "r1", status: "open" };
            mockReport.findById.mockResolvedValue(fakeReport);
            const result = await findReportForUpdate("r1");
            expect(result).toEqual(fakeReport);
        });
    });

    describe("autoHideAdIfOverThreshold", () => {
        it("does NOT hide when uniqueReports is below threshold", async () => {
            const adId = new mongoose.Types.ObjectId();
            await autoHideAdIfOverThreshold(adId, 2, 5);
            expect(mockedMutateStatus).not.toHaveBeenCalled();
        });

        it("sets moderationStatus to community_hidden when threshold is met", async () => {
            const adId = new mongoose.Types.ObjectId();
            await autoHideAdIfOverThreshold(adId, 5, 5);
            expect(mockedMutateStatus).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityId: adId,
                    patch: expect.objectContaining({ moderationStatus: "community_hidden" }),
                })
            );
        });

        it("includes ad ID in the moderationReason message", async () => {
            const adId = new mongoose.Types.ObjectId();
            await autoHideAdIfOverThreshold(adId, 10, 5);
            const firstCallArg = mockedMutateStatus.mock.calls[0]?.[0] as { reason?: string };
            expect(firstCallArg.reason).toMatch("10");
            expect(firstCallArg.reason).toMatch("5");
        });
    });

    describe("countActiveReports", () => {
        it("delegates to Report.countDocuments with the correct active statuses", async () => {
            const mockReport = mockReportRaw as unknown as {
                countDocuments: jest.Mock;
            };
            mockReport.countDocuments.mockResolvedValue(3);
            const adId = new mongoose.Types.ObjectId();
            const count = await countActiveReports("ad", adId);
            expect(count).toBe(3);
            expect(mockReport.countDocuments).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: { $in: expect.arrayContaining(["open", "pending", "reviewed"]) },
                })
            );
        });
    });
});
