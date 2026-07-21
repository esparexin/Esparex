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
        findById: jest.fn(),
        countDocuments: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@esparex/core/services/AdminSessionService", () => ({
    __esModule: true,
    revokeAdminSessionsForAdmin: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@esparex/core/services/AdminUsersService", () => ({
    __esModule: true,
    updateAdminById: jest.fn(),
}));

import type { Request, Response } from "express";
import * as adminUsersController from "../../controllers/admin/adminUsersController";
import Admin from "@esparex/core/models/Admin";
import { updateAdminById } from "@esparex/core/services/AdminUsersService";

// Valid 24-char hex ObjectId required by isValidObjectId at the controller boundary.
const VALID_ADMIN_OID = '64b2f3e4c5d6e7f8a9b0c3d1';

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
            params: { id: VALID_ADMIN_OID },
            body: { role: "moderator" },
            user: { _id: { toString: () => VALID_ADMIN_OID }, role: "super_admin" },
            originalUrl: `/api/v1/admin/admin-users/${VALID_ADMIN_OID}`,
        } as unknown as Request;
        const res = createMockRes(req);

        mockUpdateAdminById.mockResolvedValue({ _id: VALID_ADMIN_OID, role: "moderator" });

        await adminUsersController.updateAdmin(req, res);

        expect(mockAdmin.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockUpdateAdminById).toHaveBeenCalledWith(
            VALID_ADMIN_OID,
            req.body,
            VALID_ADMIN_OID,
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
