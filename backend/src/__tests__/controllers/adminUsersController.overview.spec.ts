jest.mock("../../models/User", () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn(),
    },
}));

jest.mock("../../models/AdminMetrics", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("../../models/Admin", () => ({
    __esModule: true,
    default: {},
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: {},
}));

import type { Request, Response } from "express";
import * as adminUsersController from "../../controllers/admin/adminUsersController";
import User from "../../models/User";
import AdminMetrics from "../../models/AdminMetrics";

const createMockRes = (req?: Partial<Request>) => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    if (req) res.req = req as Request;
    return res;
};

const mockMetricsChain = (payload: unknown) => {
    const lean = jest.fn().mockResolvedValue(payload);
    const sort = jest.fn().mockReturnValue({ lean });
    const findOne = (AdminMetrics as unknown as { findOne: jest.Mock }).findOne;
    findOne.mockReturnValue({ sort });
};

describe("adminUsersController.getUserManagementOverview", () => {
    const mockUser = User as unknown as { countDocuments: jest.Mock };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns live totals when metrics cache is missing", async () => {
        mockMetricsChain(null);
        mockUser.countDocuments
            .mockResolvedValueOnce(2) // newUsersToday
            .mockResolvedValueOnce(1) // suspendedUsers
            .mockResolvedValueOnce(1) // bannedUsers
            .mockResolvedValueOnce(8) // totalUsers (live fallback)
            .mockResolvedValueOnce(6) // activeUsers (live fallback)
            .mockResolvedValueOnce(5); // verifiedUsers (live fallback)

        const req = { originalUrl: "/api/v1/admin/user-management/overview" } as unknown as Request;
        const res = createMockRes(req);

        await adminUsersController.getUserManagementOverview(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    totalUsers: 8,
                    activeUsers: 6,
                    verifiedUsers: 5,
                    suspendedUsers: 1,
                    bannedUsers: 1,
                    newUsersToday: 2,
                }),
            })
        );
        expect(mockUser.countDocuments).toHaveBeenCalledTimes(6);
    });

    it("prefers cached totals when metrics cache is complete", async () => {
        mockMetricsChain({
            payload: {
                totalUsers: 10,
                activeUsers: 7,
                verifiedUsers: 4,
                newUsersThisWeek: 3,
                businessUsers: 2,
            },
        });
        mockUser.countDocuments
            .mockResolvedValueOnce(1) // newUsersToday
            .mockResolvedValueOnce(2) // suspendedUsers
            .mockResolvedValueOnce(3); // bannedUsers

        const req = { originalUrl: "/api/v1/admin/user-management/overview" } as unknown as Request;
        const res = createMockRes(req);

        await adminUsersController.getUserManagementOverview(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    totalUsers: 10,
                    activeUsers: 7,
                    verifiedUsers: 4,
                    suspendedUsers: 2,
                    bannedUsers: 3,
                    newUsersToday: 1,
                }),
            })
        );
        expect(mockUser.countDocuments).toHaveBeenCalledTimes(3);
    });
});

