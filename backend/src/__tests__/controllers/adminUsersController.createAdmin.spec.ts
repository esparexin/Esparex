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
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

import * as adminUsersController from "../../controllers/admin/adminUsersController";
import Admin from "../../models/Admin";
import { logAdminAction } from "../../utils/adminLogger";

const createMockRes = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as any;
    return res;
};

describe("adminUsersController.createAdmin", () => {
    const mockAdmin = Admin as unknown as { findOne: jest.Mock; create: jest.Mock };
    const mockLogAdminAction = logAdminAction as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates admin from canonical endpoint payload and keeps plaintext for model hook hashing", async () => {
        mockAdmin.findOne.mockResolvedValue(null);
        mockAdmin.create.mockResolvedValue({
            _id: { toString: () => "admin_1" },
            toObject: () => ({
                _id: "admin_1",
                firstName: "Ops",
                lastName: "Lead",
                email: "ops@example.com",
                role: "moderator",
                permissions: ["ads:read"],
                password: "hashed-in-model",
            }),
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
        } as any;
        const res = createMockRes();

        await adminUsersController.createAdmin(req, res);

        expect(mockAdmin.create).toHaveBeenCalledWith(
            expect.objectContaining({
                firstName: "Ops",
                lastName: "Lead",
                email: "ops@example.com",
                role: "moderator",
                permissions: ["ads:read"],
                // Regression guard: createAdmin should not pre-hash and re-hash in model.
                password: "Admin@12345",
                status: "live",
            })
        );

        expect(mockLogAdminAction).toHaveBeenCalledWith(
            req,
            "CREATE_ADMIN",
            "Admin",
            "admin_1",
            expect.objectContaining({ role: "moderator" })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    it("allows super_admin role assignment when actor is super_admin", async () => {
        mockAdmin.findOne.mockResolvedValue(null);
        mockAdmin.create.mockResolvedValue({
            _id: { toString: () => "admin_2" },
            toObject: () => ({
                _id: "admin_2",
                firstName: "Root",
                lastName: "Ops",
                email: "root@example.com",
                role: "super_admin",
                permissions: ["*"],
                password: "hashed-in-model",
            }),
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
        } as any;
        const res = createMockRes();

        await adminUsersController.createAdmin(req, res);

        expect(mockAdmin.create).toHaveBeenCalledWith(
            expect.objectContaining({
                role: "super_admin",
                password: "Admin@12345",
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
