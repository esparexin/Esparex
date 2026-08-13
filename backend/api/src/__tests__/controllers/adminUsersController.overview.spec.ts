jest.mock("@esparex/core/models/User", () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn(),
        aggregate: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/AdminMetrics", () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
    },
}));

jest.mock("@esparex/core/models/Admin", () => ({
    __esModule: true,
    default: {},
}));

jest.mock("@esparex/core/models/Ad", () => ({
    __esModule: true,
    default: {},
}));

import type { Request, Response } from "express";
import * as adminUsersController from "../../controllers/admin/adminUsersController";
import User from "@esparex/core/models/User";

const createMockRes = (req?: Partial<Request>) => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as any;
    if (req) res.req = req as Request;
    return res;
};

describe("adminUsersController.getUserManagementOverview", () => {
    const mockUser = User as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns live overview metrics via single $facet aggregation", async () => {
        mockUser.aggregate.mockResolvedValue([
            {
                totalUsers: [{ count: 8 }],
                activeUsers: [{ count: 6 }],
                suspendedUsers: [{ count: 1 }],
                bannedUsers: [{ count: 1 }],
                verifiedUsers: [{ count: 5 }],
                individuals: [{ count: 6 }],
                businesses: [{ count: 2 }],
                verifiedBusinesses: [{ count: 2 }],
                blockedUsers: [{ count: 2 }],
                newUsersToday: [{ count: 2 }],
            },
        ]);

        const req = { originalUrl: "/api/v1/admin/user-management/overview" } as any;
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
                    individuals: 6,
                    businesses: 2,
                    verifiedBusinesses: 2,
                    blockedUsers: 2,
                    newUsersToday: 2,
                }),
            })
        );
        expect(mockUser.aggregate).toHaveBeenCalledTimes(1);
    });
});

