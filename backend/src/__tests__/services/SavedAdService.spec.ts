jest.mock("../../models/SavedAd", () => ({
    __esModule: true,
    default: {
        aggregate: jest.fn(),
        create: jest.fn(),
        findOneAndDelete: jest.fn(),
    },
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findOneAndUpdate: jest.fn(),
    },
}));

jest.mock("../../services/ad/AdAggregationService", () => ({
    hydrateAdMetadata: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../utils/s3", () => ({
    sanitizePersistedImageUrls: jest.fn((imgs: string[]) => imgs),
}));

jest.mock("../../utils/serialize", () => ({
    serializeDoc: jest.fn((doc: unknown) => ({ ...(doc as object) })),
}));

jest.mock("../../services/TrendingService", () => ({
    recordAdAnalyticsEvent: jest.fn(),
}));

import SavedAd from "../../models/SavedAd";
import Ad from "../../models/Ad";
import { saveAd, unsaveAd } from "../../services/SavedAdService";

const mockSavedAd = SavedAd as unknown as {
    aggregate: jest.Mock;
    create: jest.Mock;
    findOneAndDelete: jest.Mock;
};
const mockAd = Ad as unknown as {
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findOneAndUpdate: jest.Mock;
};

describe("SavedAdService", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("saveAd", () => {
        it("creates a SavedAd document and increments favorites when ad exists", async () => {
            mockAd.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ _id: "ad_1" }),
                }),
            });
            mockSavedAd.create.mockResolvedValue({});
            mockAd.findByIdAndUpdate.mockResolvedValue(null);

            const result = await saveAd("user_1", "ad_1");

            expect(result).toBe(true);
            expect(mockSavedAd.create).toHaveBeenCalledWith({ userId: "user_1", adId: "ad_1" });
        });

        it("returns null when ad does not exist", async () => {
            mockAd.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });

            const result = await saveAd("user_1", "nonexistent_ad");

            expect(result).toBeNull();
            expect(mockSavedAd.create).not.toHaveBeenCalled();
        });
    });

    describe("unsaveAd", () => {
        it("decrements favorites when a saved record is found and deleted", async () => {
            mockSavedAd.findOneAndDelete.mockResolvedValue({ _id: "saved_1" });
            mockAd.findOneAndUpdate.mockResolvedValue(null);

            await unsaveAd("user_1", "ad_1");

            expect(mockSavedAd.findOneAndDelete).toHaveBeenCalledWith({ userId: "user_1", adId: "ad_1" });
            expect(mockAd.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: "ad_1", "views.favorites": { $gt: 0 } },
                { $inc: { "views.favorites": -1 } }
            );
        });

        it("does not decrement favorites when no saved record exists", async () => {
            mockSavedAd.findOneAndDelete.mockResolvedValue(null);

            await unsaveAd("user_1", "ad_never_saved");

            expect(mockAd.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });
});
