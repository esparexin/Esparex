jest.mock("@core/models/Business", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("@core/models/Ad", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
    },
}));

jest.mock("@core/utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@core/utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
    logBusiness: jest.fn(),
    logSecurity: jest.fn(),
}));

jest.mock("@core/services/NotificationService", () => ({
    __esModule: true,
    createInAppNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@core/services/TrustService", () => ({
    __esModule: true,
    recalculateTrustScore: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@core/services/BusinessService", () => ({
    __esModule: true,
    approveBusiness: jest.fn(),
    rejectBusiness: jest.fn(),
    softDeleteBusiness: jest.fn(),
    buildBusinessLocationPayload: jest.fn(),
}));

jest.mock("@core/services/AdminBusinessService", () => ({
    __esModule: true,
    getBusinessOverview: jest.fn(),
    getBusinessAccountsQuery: jest.fn(),
    transformBusinessDocs: jest.fn(),
    findBusinessForAdmin: jest.fn(),
    updateAdminBusiness: jest.fn(),
    updateAdminBusinessFields: jest.fn(),
    serializeBusinessForAdmin: jest.fn().mockImplementation((b) => b),
}));

jest.mock("@core/services/StatusMutationService", () => ({
    __esModule: true,
    mutateStatus: jest.fn(),
    mutateStatuses: jest.fn(),
}));

jest.mock("@core/utils/contentHandler", () => ({
    __esModule: true,
    handlePaginatedContent: jest.fn(),
}));

jest.mock("@core/services/location/LocationNormalizer", () => ({
    normalizeLocation: jest.fn()
}));

jest.mock("../../controllers/business/shared", () => ({
    __esModule: true,
    serializeBusinessForAdmin: jest.fn().mockImplementation((b) => b),
    serializeBusinessForOwner: jest.fn().mockImplementation((b) => b),
    serializeBusiness: jest.fn().mockImplementation((b) => b),
    findBusinessByIdentifier: jest.fn(),
    resolveDuplicateBusinessMessage: jest.fn().mockReturnValue(null),
}));

jest.mock("@core/utils/s3", () => ({
    __esModule: true,
    sanitizePersistedImageUrls: jest.fn().mockReturnValue([]),
    uploadToS3: jest.fn(),
    deleteFromS3: jest.fn(),
}));

import type { Request, Response } from "express";
import * as adminBusinessController from "../../../../admin-backend/src/controllers/admin/adminBusinessController";
import * as adminBusinessService from "@core/services/AdminBusinessService";

const createMockRes = (req?: Record<string, unknown>) => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        req,
    };
    return res;
};

describe("adminBusinessController.updateBusinessByAdmin", () => {
    const mockAdminBusinessService = adminBusinessService as unknown as {
        findBusinessForAdmin: jest.Mock;
        updateAdminBusiness: jest.Mock;
        updateAdminBusinessFields: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("passes updates to AdminBusinessService.updateAdminBusinessFields", async () => {
        const updatedBusiness = {
            _id: "65f0a1b2c3d4e5f607182930",
            name: "Updated Business",
            mobile: "9876543210",
        };

        mockAdminBusinessService.updateAdminBusinessFields.mockResolvedValue(updatedBusiness);

        const req = {
            params: { id: "65f0a1b2c3d4e5f607182930" },
            body: {
                mobile: "9876543210",
                location: {
                    city: "Secunderabad",
                    state: "Telangana",
                    pincode: "500003",
                },
            },
            user: { id: "admin_1" },
            originalUrl: "/api/v1/admin/businesses/65f0a1b2c3d4e5f607182930",
        } as unknown as Request;
        const res = createMockRes(req as unknown as Record<string, unknown>) as unknown as Response;

        await adminBusinessController.updateBusinessByAdmin(req, res);

        expect(mockAdminBusinessService.updateAdminBusinessFields).toHaveBeenCalledWith(
            "65f0a1b2c3d4e5f607182930",
            req.body,
            "admin_1",
            expect.any(Function) // buildLogFn
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Business updated successfully",
                data: expect.objectContaining({
                    id: "65f0a1b2c3d4e5f607182930",
                }),
            })
        );
    });
});
