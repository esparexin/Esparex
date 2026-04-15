jest.mock("../../models/ApiKey", () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        countDocuments: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

import type { Request, Response } from "express";
import * as apiKeyController from "../../controllers/admin/adminApiKeyController";
import ApiKey from "../../models/ApiKey";

const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
});

describe("adminApiKeyController", () => {
    const mockApiKey = ApiKey as unknown as {
        create: jest.Mock;
        findByIdAndUpdate: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates API key and returns one-time plaintext key", async () => {
        mockApiKey.create.mockResolvedValue({
            _id: { toString: () => "key_1" },
            toJSON: () => ({
                id: "key_1",
                name: "Ops Integration",
                keyPrefix: "esk_live_abcd",
                scopes: ["ads:read"],
                status: "active",
            }),
        });

        const req = {
            body: { name: "Ops Integration", scopes: ["ads:read"] },
            user: { _id: "65f0a1b2c3d4e5f607182930" },
            originalUrl: "/api/v1/admin/api-keys",
        } as unknown as Request;
        const res = createMockRes() as unknown as Response;

        await apiKeyController.createApiKey(req, res);

        expect(mockApiKey.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Ops Integration",
                status: "active",
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: "key_1",
                    key: expect.stringMatching(/^esk_live_/),
                }),
            })
        );
    });

    it("revokes API key", async () => {
        mockApiKey.findByIdAndUpdate.mockResolvedValue({
            _id: "key_1",
            keyPrefix: "esk_live_abcd",
            status: "revoked",
        });

        const req = {
            params: { id: "65f0a1b2c3d4e5f607182930" },
            user: { _id: "65f0a1b2c3d4e5f607182931" },
            originalUrl: "/api/v1/admin/api-keys/65f0a1b2c3d4e5f607182930/revoke",
        } as unknown as Request;
        const res = createMockRes() as unknown as Response;

        await apiKeyController.revokeApiKey(req, res);

        expect(mockApiKey.findByIdAndUpdate).toHaveBeenCalledWith(
            "65f0a1b2c3d4e5f607182930",
            expect.objectContaining({ status: "revoked" }),
            { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

