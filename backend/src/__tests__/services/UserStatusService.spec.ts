jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("../../models/Ad", () => ({
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

jest.mock("../../models/SmartAlert", () => ({
    __esModule: true,
    default: {
        updateMany: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

import User from "../../models/User";
import Ad from "../../models/Ad";
import SmartAlert from "../../models/SmartAlert";
import { logAdminAction } from "../../utils/adminLogger";
import { updateUserStatus } from "../../services/UserStatusService";

describe("userStatusService audit integration", () => {
    const mockUserFindByIdAndUpdate = (User as unknown as { findByIdAndUpdate: jest.Mock }).findByIdAndUpdate;
    const mockAdUpdateMany = (Ad as unknown as { updateMany: jest.Mock }).updateMany;
    const mockAlertUpdateMany = (SmartAlert as unknown as { updateMany: jest.Mock }).updateMany;
    const mockLogAdminAction = logAdminAction as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserFindByIdAndUpdate.mockResolvedValue({ _id: "user_1", status: "suspended" });
        mockAdUpdateMany.mockResolvedValue({ modifiedCount: 1 });
        mockAlertUpdateMany.mockResolvedValue({ modifiedCount: 1 });
    });

    it("logs STATUS_UPDATE_SUSPENDED when admin suspends user", async () => {
        const req = { originalUrl: "/api/v1/admin/users/user_1/suspend", user: { _id: "admin_1" } } as any;

        await updateUserStatus("user_1", "suspended", {
            actor: "ADMIN",
            adminReq: req,
            reason: "Policy violation",
        });

        expect(mockLogAdminAction).toHaveBeenCalledWith(
            req,
            "STATUS_UPDATE_SUSPENDED",
            "User",
            "user_1",
            expect.objectContaining({ reason: "Policy violation" })
        );
    });

    it("logs STATUS_UPDATE_BANNED and disables alerts", async () => {
        const req = { originalUrl: "/api/v1/admin/users/user_1/ban", user: { _id: "admin_1" } } as any;

        await updateUserStatus("user_1", "banned", {
            actor: "ADMIN",
            adminReq: req,
            reason: "Fraud",
        });

        expect(mockAlertUpdateMany).toHaveBeenCalledWith({ userId: "user_1" }, { isActive: false });
        expect(mockLogAdminAction).toHaveBeenCalledWith(
            req,
            "STATUS_UPDATE_BANNED",
            "User",
            "user_1",
            expect.objectContaining({ reason: "Fraud" })
        );
    });
});
