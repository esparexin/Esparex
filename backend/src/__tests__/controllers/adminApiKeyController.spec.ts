jest.mock("../../services/ApiKeyService", () => ({
    __esModule: true,
    getApiKeys: jest.fn(),
    createApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
}));

jest.mock("../../utils/adminLogger", () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

import type { Request, Response } from "express";
import * as apiKeyController from "../../controllers/admin/adminApiKeyController";
import * as apiKeyService from "../../services/ApiKeyService";

const createMockRes = (req?: Record<string, unknown>) => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    req,
});

describe("adminApiKeyController", () => {
    const mockApiKeyService = apiKeyService as unknown as {
        createApiKey: jest.Mock;
        revokeApiKey: jest.Mock;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates API key and returns one-time plaintext key", async () => {
        mockApiKeyService.createApiKey.mockResolvedValue({
            apiKey: {
                _id: "key_1",
                toJSON: () => ({
                    id: "key_1",
                    name: "Ops Integration",
                    keyPrefix: "esk_live_abcd",
                    scopes: ["ads:read"],
                    status: "active",
                })
            },
            rawKey: "esk_live_abcd_12345"
        });

        const req = {
            body: { name: "Ops Integration", scopes: ["ads:read"] },
            user: { _id: "65f0a1b2c3d4e5f607182930" },
            originalUrl: "/api/v1/admin/api-keys",
        } as unknown as Request;
        const res = createMockRes(req as unknown as Record<string, unknown>) as unknown as Response;

        await apiKeyController.createApiKey(req, res);

        expect(mockApiKeyService.createApiKey).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Ops Integration",
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
        mockApiKeyService.revokeApiKey.mockResolvedValue({
            _id: "key_1",
            keyPrefix: "esk_live_abcd",
            status: "revoked",
        });

        const req = {
            params: { id: "65f0a1b2c3d4e5f607182930" },
            user: { _id: "65f0a1b2c3d4e5f607182931" },
            originalUrl: "/api/v1/admin/api-keys/65f0a1b2c3d4e5f607182930/revoke",
        } as unknown as Request;
        const res = createMockRes(req as unknown as Record<string, unknown>) as unknown as Response;

        await apiKeyController.revokeApiKey(req, res);

        expect(mockApiKeyService.revokeApiKey).toHaveBeenCalledWith(
            "65f0a1b2c3d4e5f607182930"
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

