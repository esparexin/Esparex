jest.mock("@esparex/core/models/User", () => ({
    __esModule: true,
    default: {
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/Ad", () => ({
    __esModule: true,
    default: {
        updateMany: jest.fn(),
        find: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
            }),
        }),
    },
}));

jest.mock("@esparex/core/models/SmartAlert", () => ({
    __esModule: true,
    default: {
        updateMany: jest.fn(),
    },
}));

import User from "../../models/User";
import Ad from "../../models/Ad";
import SmartAlert from "../../models/SmartAlert";
import { updateUserStatus } from "../../services/UserStatusService";

describe("userStatusService audit integration", () => {
    const mockUserFindByIdAndUpdate = (User as unknown as { findByIdAndUpdate: jest.Mock }).findByIdAndUpdate;
    const mockAdUpdateMany = (Ad as unknown as { updateMany: jest.Mock }).updateMany;
    const mockAlertUpdateMany = (SmartAlert as unknown as { updateMany: jest.Mock }).updateMany;
    let mockLogFn: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserFindByIdAndUpdate.mockResolvedValue({ _id: "user_1", status: "suspended" });
        mockAdUpdateMany.mockResolvedValue({ modifiedCount: 1 });
        mockAlertUpdateMany.mockResolvedValue({ modifiedCount: 1 });
        mockLogFn = jest.fn().mockResolvedValue(undefined);
    });

    it("logs STATUS_UPDATE_SUSPENDED when admin suspends user", async () => {
        await updateUserStatus("user_1", "suspended", {
            actor: "ADMIN",
            logFn: mockLogFn,
            reason: "Policy violation",
        });

        expect(mockLogFn).toHaveBeenCalledWith(
            "STATUS_UPDATE_SUSPENDED",
            "User",
            "user_1",
            expect.objectContaining({ reason: "Policy violation" })
        );
    });

    it("logs STATUS_UPDATE_BANNED and disables alerts", async () => {
        await updateUserStatus("user_1", "banned", {
            actor: "ADMIN",
            logFn: mockLogFn,
            reason: "Fraud",
        });

        expect(mockAlertUpdateMany).toHaveBeenCalledWith({ userId: "user_1" }, { isActive: false });
        expect(mockLogFn).toHaveBeenCalledWith(
            "STATUS_UPDATE_BANNED",
            "User",
            "user_1",
            expect.objectContaining({ reason: "Fraud" })
        );
    });
});
