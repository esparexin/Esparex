jest.mock("../../models/Business", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("../../models/Ad", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../services/NotificationService", () => ({
    __esModule: true,
    createInAppNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../services/TrustService", () => ({
    __esModule: true,
    recalculateTrustScore: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../services/BusinessService", () => ({
    __esModule: true,
    approveBusiness: jest.fn(),
    rejectBusiness: jest.fn(),
    softDeleteBusiness: jest.fn(),
    buildBusinessLocationPayload: jest.fn(),
}));

jest.mock("../../services/AdminBusinessService", () => ({
    __esModule: true,
    getBusinessOverview: jest.fn(),
    getBusinessAccountsQuery: jest.fn(),
    transformBusinessDocs: jest.fn(),
}));

jest.mock("../../services/StatusMutationService", () => ({
    __esModule: true,
    mutateStatus: jest.fn(),
    mutateStatuses: jest.fn(),
}));

jest.mock("../../utils/contentHandler", () => ({
    __esModule: true,
    handlePaginatedContent: jest.fn(),
}));

jest.mock("../../services/location/LocationNormalizer", () => ({
    normalizeLocation: jest.fn()
}));

import * as adminBusinessController from "../../controllers/admin/adminBusinessController";
import Business from "../../models/Business";
import { buildBusinessLocationPayload } from "../../services/BusinessService";
import { normalizeLocation } from "../../services/location/LocationNormalizer";

const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

describe("adminBusinessController.updateBusinessByAdmin", () => {
    const mockBusiness = Business as unknown as {
        findById: jest.Mock;
        findByIdAndUpdate: jest.Mock;
    };
    const mockBuildBusinessLocationPayload = buildBusinessLocationPayload as unknown as jest.Mock;
    const mockNormalizeLocation = normalizeLocation as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("merges location patches without dropping structured address fields", async () => {
        const existingBusiness = {
            _id: "65f0a1b2c3d4e5f607182930",
            location: {
                address: "Shop 4, MG Road, Near Metro, Hyderabad, Telangana, 500001",
                display: "Hyderabad, Telangana",
                shopNo: "Shop 4",
                street: "MG Road",
                landmark: "Near Metro",
                city: "Hyderabad",
                state: "Telangana",
                pincode: "500001",
                coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
            },
        };
        const updatedBusiness = {
            _id: "65f0a1b2c3d4e5f607182930",
            name: "Updated Business",
            mobile: "9876543210",
            location: {
                address: "Shop 4, MG Road, Near Metro, Secunderabad, Telangana, 500003",
                display: "Secunderabad, Telangana",
                shopNo: "Shop 4",
                street: "MG Road",
                landmark: "Near Metro",
                city: "Secunderabad",
                state: "Telangana",
                pincode: "500003",
                coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
            },
        };

        mockBusiness.findById.mockResolvedValue(existingBusiness);
        mockNormalizeLocation.mockResolvedValue({
            locationId: "65f0a1b2c3d4e5f607182930",
            city: "Secunderabad",
            state: "Telangana",
            country: "India",
            display: "Secunderabad, Telangana",
            pincode: "500003",
            coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
        });
        mockBuildBusinessLocationPayload.mockReturnValue({
            locationId: "65f0a1b2c3d4e5f607182930",
            location: updatedBusiness.location,
        });
        mockBusiness.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValue(updatedBusiness),
        });

        const req = {
            params: { id: "65f0a1b2c3d4e5f607182930" },
            body: {
                phone: "9876543210",
                location: {
                    city: "Secunderabad",
                    state: "Telangana",
                    pincode: "500003",
                },
            },
            user: { id: "admin_1" },
            originalUrl: "/api/v1/admin/businesses/65f0a1b2c3d4e5f607182930",
        } as any;
        const res = createMockRes() as any;

        await adminBusinessController.updateBusinessByAdmin(req, res);

        expect(mockBusiness.findById).toHaveBeenCalledWith("65f0a1b2c3d4e5f607182930");
        expect(mockNormalizeLocation).toHaveBeenCalledWith(
            expect.objectContaining({
                city: "Secunderabad",
                state: "Telangana",
                pincode: "500003",
            })
        );
        expect(mockBuildBusinessLocationPayload).toHaveBeenCalledWith(
            expect.objectContaining({
                incomingLocation: expect.objectContaining({
                    city: "Secunderabad",
                    state: "Telangana",
                    pincode: "500003",
                }),
            })
        );
        expect(mockBusiness.findByIdAndUpdate).toHaveBeenCalledWith(
            "65f0a1b2c3d4e5f607182930",
            {
                $set: expect.objectContaining({
                    mobile: "9876543210",
                    location: expect.objectContaining({
                        address: "Shop 4, MG Road, Near Metro, Secunderabad, Telangana, 500003",
                        display: "Secunderabad, Telangana",
                        shopNo: "Shop 4",
                        street: "MG Road",
                        landmark: "Near Metro",
                        city: "Secunderabad",
                        state: "Telangana",
                        pincode: "500003",
                        coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
                    }),
                }),
            },
            { new: true, runValidators: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Business updated successfully",
                data: expect.objectContaining({
                    name: "Updated Business",
                }),
            })
        );
    });

    it("applies canonical locationId repairs from admin edits", async () => {
        const existingBusiness = {
            _id: "65f0a1b2c3d4e5f607182930",
            locationId: "65f0a1b2c3d4e5f607182930",
            location: {
                address: "Shop 4, MG Road, Near Metro, Hyderabad, Telangana, 500001",
                display: "Hyderabad, Telangana",
                shopNo: "Shop 4",
                street: "MG Road",
                landmark: "Near Metro",
                city: "Hyderabad",
                state: "Telangana",
                pincode: "500001",
                coordinates: { type: "Point", coordinates: [78.4867, 17.385] },
            },
        };
        const canonicalLocation = {
            locationId: "65f0a1b2c3d4e5f607182931",
            city: "Secunderabad",
            state: "Telangana",
            country: "India",
            display: "Tarnaka, Secunderabad",
            coordinates: { type: "Point", coordinates: [78.533, 17.428] },
        };
        const updatedBusiness = {
            _id: "65f0a1b2c3d4e5f607182930",
            locationId: "65f0a1b2c3d4e5f607182931",
            location: {
                address: "Shop 4, MG Road, Near Metro, Secunderabad, Telangana, 500001",
                display: "Tarnaka, Secunderabad",
                shopNo: "Shop 4",
                street: "MG Road",
                landmark: "Near Metro",
                city: "Secunderabad",
                state: "Telangana",
                pincode: "500001",
                coordinates: { type: "Point", coordinates: [78.533, 17.428] },
            },
        };

        mockBusiness.findById.mockResolvedValue(existingBusiness);
        mockNormalizeLocation.mockResolvedValue(canonicalLocation);
        mockBuildBusinessLocationPayload.mockReturnValue({
            locationId: "65f0a1b2c3d4e5f607182931",
            location: updatedBusiness.location,
        });
        mockBusiness.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValue(updatedBusiness),
        });

        const req = {
            params: { id: "65f0a1b2c3d4e5f607182930" },
            body: {
                location: {
                    locationId: "65f0a1b2c3d4e5f607182931",
                    coordinates: { type: "Point", coordinates: [78.533, 17.428] },
                },
            },
            user: { id: "admin_1" },
            originalUrl: "/api/v1/admin/businesses/65f0a1b2c3d4e5f607182930",
        } as any;
        const res = createMockRes() as any;

        await adminBusinessController.updateBusinessByAdmin(req, res);

        expect(mockNormalizeLocation).toHaveBeenCalledWith(
            expect.objectContaining({
                locationId: "65f0a1b2c3d4e5f607182931",
                coordinates: { type: "Point", coordinates: [78.533, 17.428] },
            })
        );
        expect(mockBusiness.findByIdAndUpdate).toHaveBeenCalledWith(
            "65f0a1b2c3d4e5f607182930",
            {
                $set: expect.objectContaining({
                    locationId: "65f0a1b2c3d4e5f607182931",
                    location: expect.objectContaining({
                        display: "Tarnaka, Secunderabad",
                        city: "Secunderabad",
                        coordinates: { type: "Point", coordinates: [78.533, 17.428] },
                    }),
                }),
            },
            { new: true, runValidators: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
