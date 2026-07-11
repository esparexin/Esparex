jest.mock("@esparex/core/models/User", () => ({
    __esModule: true,
    default: {}
}));

jest.mock("@esparex/core/models/Ad", () => ({
    __esModule: true,
    default: {}
}));

jest.mock("@esparex/core/models/Admin", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@esparex/core/services/AdminUsersService", () => ({
    __esModule: true,
    createAdminAccount: jest.fn(),
}));

import * as adminUsersController from "../../controllers/admin/adminUsersController";
import type { Request, Response } from "express";
import { createAdminAccount } from "@esparex/core/services/AdminUsersService";

const createMockRes = (req?: Partial<Request>) => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    if (req) res.req = req as Request;
    return res;
};

describe("adminUsersController.createAdmin", () => {
    const mockCreateAdminAccount = createAdminAccount as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates admin from canonical endpoint payload and keeps plaintext for model hook hashing", async () => {
        mockCreateAdminAccount.mockResolvedValue({
            _id: "admin_1",
            firstName: "Ops",
            lastName: "Lead",
            email: "ops@example.com",
            role: "moderator",
            permissions: ["ads:read"],
        });

        const req = {
            body: {
                name: "Ops Lead",
                email: "OPS@EXAMPLE.COM",
                password: "Admin@12345",
                role: "moderator",
                permissions: ["ads:read"],
            },
            user: { _id: "super_1", role: "super_admin" },
            originalUrl: "/api/v1/admin/admins",
        } as unknown as Request;
        const res = createMockRes(req);

        await adminUsersController.createAdmin(req, res);

        expect(mockCreateAdminAccount).toHaveBeenCalledWith(
            req.body,
            "super_admin",
            "super_1",
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    it("allows super_admin role assignment when actor is super_admin", async () => {
        mockCreateAdminAccount.mockResolvedValue({
            _id: "admin_2",
            firstName: "Root",
            lastName: "Ops",
            email: "root@example.com",
            role: "super_admin",
            permissions: ["*"],
        });

        const req = {
            body: {
                name: "Root Ops",
                email: "root@example.com",
                password: "Admin@12345",
                role: "super_admin",
            },
            user: { _id: "super_1", role: "super_admin" },
            originalUrl: "/api/v1/admin/admin-users",
        } as unknown as Request;
        const res = createMockRes(req);

        await adminUsersController.createAdmin(req, res);

        expect(mockCreateAdminAccount).toHaveBeenCalledWith(
            req.body,
            "super_admin",
            "super_1",
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
