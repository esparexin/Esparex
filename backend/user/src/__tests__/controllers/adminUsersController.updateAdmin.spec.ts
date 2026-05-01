jest.mock("@core/models/User", () => ({
    __esModule: true,
    default: {}
}));

jest.mock("@core/models/Ad", () => ({
    __esModule: true,
    default: {}
}));

jest.mock("@core/models/Admin", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        countDocuments: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("@core/utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@core/services/AdminSessionService", () => ({
    __esModule: true,
    revokeAdminSessionsForAdmin: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@core/services/AdminUsersService", () => ({
    __esModule: true,
    updateAdminById: jest.fn(),
}));

import type { Request, Response } from "express";
import * as adminUsersController from "../../../../admin-backend/src/controllers/admin/adminUsersController";
import Admin from "@core/models/Admin";
import { updateAdminById } from "@core/services/AdminUsersService";

const createMockRes = (req?: Partial<Request>) => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    if (req) res.req = req as Request;
    return res;
};

describe("adminUsersController.updateAdmin", () => {
    const mockAdmin = Admin as unknown as {
        findById: jest.Mock;
        countDocuments: jest.Mock;
        findByIdAndUpdate: jest.Mock;
    };
    const mockUpdateAdminById = updateAdminById as jest.Mock;

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
        const res = createMockRes(req);

        mockUpdateAdminById.mockResolvedValue({ _id: "admin_1", role: "moderator" });

        await adminUsersController.updateAdmin(req, res);

        expect(mockAdmin.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockUpdateAdminById).toHaveBeenCalledWith(
            "admin_1",
            req.body,
            "admin_1",
            "super_admin",
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
            })
        );
    });
});
