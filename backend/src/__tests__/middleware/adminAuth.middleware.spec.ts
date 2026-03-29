jest.mock("../../models/Admin", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    },
}));

jest.mock("../../utils/auth", () => ({
    __esModule: true,
    verifyAdminToken: jest.fn(),
}));

jest.mock("../../services/AdminSessionService", () => ({
    __esModule: true,
    validateAdminSession: jest.fn(),
    getAdminSessionTtlMs: jest.fn(() => 8 * 60 * 60 * 1000),
}));

jest.mock("../../utils/cookieHelper", () => ({
    __esModule: true,
    getAdminCookieOptions: jest.fn(() => ({ path: "/api/v1/admin" })),
    getAuthCookieOptions: jest.fn(() => ({ path: "/" })),
}));

import Admin from "../../models/Admin";
import { verifyAdminToken } from "../../utils/auth";
import { validateAdminSession } from "../../services/AdminSessionService";
import { requireAdmin, requirePermission } from "../../middleware/adminAuth";

const createMockRes = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn(),
        clearCookie: jest.fn(),
    } as any;
    return res;
};

describe("adminAuth middleware", () => {
    const mockFindById = (Admin as unknown as { findById: jest.Mock }).findById;
    const mockVerifyAdminToken = verifyAdminToken as jest.Mock;
    const mockValidateAdminSession = validateAdminSession as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 401 when token is missing", async () => {
        const req = { cookies: {}, originalUrl: "/api/v1/admin/users" } as any;
        const res = createMockRes();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when session is revoked/missing", async () => {
        const req = { cookies: { admin_token: "jwt_token" }, originalUrl: "/api/v1/admin/users" } as any;
        const res = createMockRes();
        const next = jest.fn();

        mockVerifyAdminToken.mockReturnValue({ id: "admin_1", role: "admin", jti: "jti_1" });
        mockValidateAdminSession.mockResolvedValue(null);

        await requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: 'Unauthorized: Session expired. Please login again.',
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("passes when token, session, and admin are valid", async () => {
        const req = { cookies: { admin_token: "jwt_token" }, originalUrl: "/api/v1/admin/users" } as any;
        const res = createMockRes();
        const next = jest.fn();

        mockVerifyAdminToken.mockReturnValue({ id: "admin_1", role: "admin", jti: "jti_1" });
        mockValidateAdminSession.mockResolvedValue({ id: "session_1" });
        mockFindById.mockResolvedValue({
            _id: { toString: () => "admin_1" },
            status: "live",
            role: "admin",
            permissions: ["users:read"],
            firstName: "Ops",
            lastName: "Lead",
            email: "ops@example.com",
        });

        await requireAdmin(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toEqual(
            expect.objectContaining({
                id: "admin_1",
                role: "admin",
                isAdmin: true,
            })
        );
    });

    it("grants mapped permission access for role fallback", () => {
        const req = {
            user: { role: "admin", permissions: [] },
            originalUrl: "/api/v1/admin/users",
        } as any;
        const res = createMockRes();
        const next = jest.fn();

        const middleware = requirePermission("users:read");
        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("grants chat moderation read access through role fallback", () => {
        const req = {
            user: { role: "moderator", permissions: [] },
            originalUrl: "/api/v1/admin/chat/list",
        } as any;
        const res = createMockRes();
        const next = jest.fn();

        const middleware = requirePermission("chat:read");
        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});
