jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {}
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: {}
}));

jest.mock("../../models/Admin", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        countDocuments: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../services/AdminSessionService", () => ({
    __esModule: true,
    revokeAdminSessionsForAdmin: jest.fn().mockResolvedValue(undefined),
}));

import type { Request, Response } from "express";
import * as adminUsersController from "../../controllers/admin/adminUsersController";
import Admin from "../../models/Admin";

const createMockRes = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
};

describe("adminUsersController.updateAdmin", () => {
    const mockAdmin = Admin as unknown as {
        findById: jest.Mock;
        countDocuments: jest.Mock;
        findByIdAndUpdate: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("blocks self role change", async () => {
        const req = {
            params: { id: "admin_1" },
            body: { role: "moderator" },
            user: { _id: { toString: () => "admin_1" }, role: "super_admin" },
            originalUrl: "/api/v1/admin/admin-users/admin_1",
        } as unknown as Request;
        const res = createMockRes();

        await adminUsersController.updateAdmin(req, res);

        expect(mockAdmin.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
            })
        );
    });
});

