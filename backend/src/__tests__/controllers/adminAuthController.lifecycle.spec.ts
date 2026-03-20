import crypto from "crypto";

jest.mock("../../models/Admin", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("../../services/AdminService", () => ({
    __esModule: true,
    loginAdmin: jest.fn(),
}));

jest.mock("../../utils/systemConfigHelper", () => ({
    __esModule: true,
    getSystemConfigDoc: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../utils/cookieHelper", () => ({
    __esModule: true,
    getAdminCookieOptions: jest.fn(() => ({ path: "/api/v1/admin" })),
    getAuthCookieOptions: jest.fn(() => ({ path: "/" })),
}));

jest.mock("../../utils/auth", () => ({
    __esModule: true,
    generateAdminToken: jest.fn(() => "jwt_admin_token"),
    verifyAdminToken: jest.fn(() => ({
        id: "admin_1",
        role: "admin",
        jti: "session_jti_1",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: "admin_1",
    })),
}));

jest.mock("../../services/AdminSessionService", () => ({
    __esModule: true,
    createAdminSession: jest.fn().mockResolvedValue(undefined),
    revokeAdminSession: jest.fn().mockResolvedValue(undefined),
    revokeAdminSessionsForAdmin: jest.fn().mockResolvedValue(undefined),
    getAdminSessionTtlMs: jest.fn(() => 8 * 60 * 60 * 1000),
}));

jest.mock("../../services/emailService", () => ({
    __esModule: true,
    emailService: {
        sendEmail: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@shared/enums/userStatus", () => ({
    __esModule: true,
    USER_STATUS: {
        LIVE: "live",
        ACTIVE: "active",
        SUSPENDED: "suspended",
        BANNED: "banned",
        DELETED: "deleted",
        INACTIVE: "inactive",
    },
    USER_STATUS_VALUES: ["live", "active", "suspended", "banned", "deleted", "inactive"]
}), { virtual: true });

import Admin from "../../models/Admin";
import * as adminService from "../../services/AdminService";
import { createAdminSession, revokeAdminSessionsForAdmin } from "../../services/AdminSessionService";
import { adminLogin, resetPassword } from "../../controllers/admin/system/adminAuthController";

const createMockRes = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn(),
        clearCookie: jest.fn(),
    } as any;
    return res;
};

describe("admin auth lifecycle regressions", () => {
    const mockAdmin = Admin as unknown as { findOne: jest.Mock };
    const mockLoginAdmin = adminService.loginAdmin as jest.Mock;
    const mockCreateAdminSession = createAdminSession as jest.Mock;
    const mockRevokeAdminSessionsForAdmin = revokeAdminSessionsForAdmin as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("logs in successfully for LIVE admin (POST /api/v1/admin/login flow)", async () => {
        const activeAdmin = {
            _id: { toString: () => "admin_1" },
            firstName: "Ops",
            lastName: "Lead",
            email: "ops@example.com",
            status: "live", // Replaced legacy "active" with enforced "live"
            twoFactorEnabled: false,
        };

        mockAdmin.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(activeAdmin),
        });

        mockLoginAdmin.mockResolvedValue({
            token: "legacy_token_not_used",
            admin: {
                _id: "admin_1",
                firstName: "Ops",
                lastName: "Lead",
                role: "admin",
                permissions: ["system:config"],
                email: "ops@example.com",
            },
        });

        const req = {
            body: {
                email: "ops@example.com",
                password: "Admin@12345",
            },
            headers: { "user-agent": "jest-agent" },
            socket: { remoteAddress: "127.0.0.1" },
            originalUrl: "/api/v1/admin/login",
        } as any;
        const res = createMockRes();

        await adminLogin(req, res);

        expect(mockLoginAdmin).toHaveBeenCalledWith("ops@example.com", "Admin@12345");
        expect(res.cookie).toHaveBeenCalledWith(
            "admin_token",
            "jwt_admin_token",
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockCreateAdminSession).toHaveBeenCalledWith(
            expect.objectContaining({
                adminId: "admin_1",
                token: "jwt_admin_token",
                tokenId: "session_jti_1"
            })
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    accessToken: "jwt_admin_token",
                }),
            })
        );
    });

    it("resets password without pre-hashing in controller (model hook handles hashing)", async () => {
        const plainResetToken = "reset_token_123";
        const hashedResetToken = crypto.createHash("sha256").update(plainResetToken).digest("hex");

        const resetDoc = {
            _id: { toString: () => "admin_2" },
            email: "reset@example.com",
            password: "oldHash",
            resetPasswordToken: hashedResetToken,
            resetPasswordExpire: new Date(Date.now() + 5 * 60 * 1000),
            save: jest.fn().mockResolvedValue(undefined),
        };

        mockAdmin.findOne.mockResolvedValue(resetDoc);

        const req = {
            params: { token: plainResetToken },
            body: { password: "NewPass123" },
            originalUrl: "/api/v1/admin/reset-password/reset_token_123",
        } as any;
        const res = createMockRes();

        await resetPassword(req, res);

        // Regression guard: controller should pass plaintext to model save, avoiding double-hash.
        expect(resetDoc.password).toBe("NewPass123");
        expect(resetDoc.save).toHaveBeenCalledTimes(1);
        expect(mockRevokeAdminSessionsForAdmin).toHaveBeenCalledWith("admin_2");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });
});
