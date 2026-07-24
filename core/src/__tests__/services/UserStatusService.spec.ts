jest.mock("@esparex/core/models/User", () => ({
    __esModule: true,
    default: {
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/Ad", () => {
    const mockQuery: any = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        then: (resolve: any, reject: any) => Promise.resolve([]).then(resolve, reject)
    };
    return {
        __esModule: true,
        default: {
            updateMany: jest.fn(),
            find: jest.fn().mockReturnValue(mockQuery),
        },
    };
});

jest.mock("@esparex/core/models/SmartAlert", () => ({
    __esModule: true,
    default: {
        updateMany: jest.fn(),
    },
}));

import User from "../../models/User";
import Ad from "../../models/Ad";
import SmartAlert from "../../models/SmartAlert";
import { updateUserStatus } from "../../domains/identity/application/users/UserStatusService";

// A well-formed 24-char hex ObjectId used across all test cases.
// updateUserStatus now validates ObjectId format before any DB call.
const VALID_USER_OID = '64a1f2e3b4c5d6e7f8a9b0c2';

describe("userStatusService audit integration", () => {
    const mockUserFindByIdAndUpdate = (User as unknown as { findByIdAndUpdate: jest.Mock }).findByIdAndUpdate;
    const mockAdUpdateMany = (Ad as unknown as { updateMany: jest.Mock }).updateMany;
    const mockAlertUpdateMany = (SmartAlert as unknown as { updateMany: jest.Mock }).updateMany;
    let mockLogFn: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserFindByIdAndUpdate.mockResolvedValue({ _id: VALID_USER_OID, status: "suspended" });
        mockAdUpdateMany.mockResolvedValue({ modifiedCount: 1 });
        mockAlertUpdateMany.mockResolvedValue({ modifiedCount: 1 });
        mockLogFn = jest.fn().mockResolvedValue(undefined);
    });

    it("logs STATUS_UPDATE_SUSPENDED when admin suspends user", async () => {
        await updateUserStatus(VALID_USER_OID, "suspended", {
            actor: "ADMIN",
            logFn: mockLogFn,
            reason: "Policy violation",
        });

        expect(mockLogFn).toHaveBeenCalledWith(
            "STATUS_UPDATE_SUSPENDED",
            "User",
            VALID_USER_OID,
            expect.objectContaining({ reason: "Policy violation" })
        );
    });

    it("logs STATUS_UPDATE_BANNED and disables alerts", async () => {
        await updateUserStatus(VALID_USER_OID, "banned", {
            actor: "ADMIN",
            logFn: mockLogFn,
            reason: "Fraud",
        });

        expect(mockAlertUpdateMany).toHaveBeenCalledWith({ userId: VALID_USER_OID }, { isActive: false });
        expect(mockLogFn).toHaveBeenCalledWith(
            "STATUS_UPDATE_BANNED",
            "User",
            VALID_USER_OID,
            expect.objectContaining({ reason: "Fraud" })
        );
    });
});
